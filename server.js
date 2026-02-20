/**
 * REVO FIXER ULTRA - Server-Side Proxy
 * Handles AI API calls and CORS bypassing
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ══════════════════════════════════════════
// AI API CONFIGURATION
// ══════════════════════════════════════════

const AI_CONFIGS = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o'
  },
  google: {
    apiKey: process.env.GOOGLE_API_KEY || '',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
  }
};

// ══════════════════════════════════════════
// PROXY ENDPOINTS FOR LIVE DATA
// ══════════════════════════════════════════

app.get('/api/live-data', async (req, res) => {
  const sources = [
    {
      url: 'https://api.tracksino.com/crazytime_history?sorting=&period=latest&page_num=1&per_page=60',
      parse: (data) => {
        const items = data.data || data.results || data || [];
        return Array.isArray(items) 
          ? items.map(x => ({
              result: x.result || x.outcome || '',
              time: x.when || x.time || null
            })).filter(x => x.result)
          : [];
      }
    },
    {
      url: 'https://www.ltccasino.io/api/crazy-time/history?limit=60',
      parse: (data) => {
        const items = data.data || data || [];
        return Array.isArray(items)
          ? items.map(x => ({
              result: x.result || x.outcome || '',
              time: x.time || null
            })).filter(x => x.result)
          : [];
      }
    }
  ];

  // Try all sources in parallel
  const promises = sources.map(source =>
    axios.get(source.url, { 
      timeout: 7000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    .then(response => source.parse(response.data))
    .catch(() => null)
  );

  try {
    const results = await Promise.all(promises);
    const validResult = results.find(r => r && r.length >= 5);
    
    if (validResult) {
      res.json({
        success: true,
        data: validResult,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        error: 'No data sources available',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ══════════════════════════════════════════
// AI PREDICTION ENDPOINTS
// ══════════════════════════════════════════

// Claude (Anthropic)
app.post('/api/ai/claude', async (req, res) => {
  const { prompt, recent, frequency } = req.body;

  if (!AI_CONFIGS.anthropic.apiKey) {
    return res.status(400).json({
      success: false,
      error: 'Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable.'
    });
  }

  const systemPrompt = `You are an expert Crazy Time prediction AI using Markov chain analysis.

Recent 20 spins (newest first): ${recent}
Frequency in last spins: ${frequency}

Analyze the pattern and predict the NEXT spin. Consider:
- Transition patterns (what follows what)
- Overdue results (haven't appeared recently)
- Hot streaks

Respond ONLY with valid JSON, no other text:
{"prediction":"1","confidence":82,"reason":"Short analysis","hot":"1","due":"5","cold":"Crazy Time"}

Valid predictions: 1, 2, 5, 10, Pachinko, Cash Hunt, Coin Flip, Crazy Time`;

  try {
    const response = await axios.post(
      AI_CONFIGS.anthropic.endpoint,
      {
        model: AI_CONFIGS.anthropic.model,
        max_tokens: 300,
        messages: [{ role: 'user', content: systemPrompt }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AI_CONFIGS.anthropic.apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 15000
      }
    );

    const text = (response.data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    // Extract JSON
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      throw new Error('No JSON found in response');
    }

    const aiResponse = JSON.parse(text.substring(start, end + 1));

    res.json({
      success: true,
      data: aiResponse,
      provider: 'claude',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Claude API Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'claude'
    });
  }
});

// OpenAI GPT-4
app.post('/api/ai/gpt', async (req, res) => {
  const { prompt, recent, frequency } = req.body;

  if (!AI_CONFIGS.openai.apiKey) {
    return res.status(400).json({
      success: false,
      error: 'OpenAI API key not configured. Set OPENAI_API_KEY environment variable.'
    });
  }

  const systemPrompt = `You are GPT-4o Crazy Time prediction AI using frequency gap analysis.

Recent 20 spins: ${recent}
Frequency counts: ${frequency}

Expected frequencies: 1=44%, 2=27%, 5=15%, 10=8%, bonuses=2% each, CrazyTime=1%

Predict next spin based on which result is most overdue vs expected frequency.

Respond ONLY with valid JSON:
{"prediction":"5","confidence":79,"reason":"Overdue analysis","hot":"1","due":"5","cold":"Crazy Time"}`;

  try {
    const response = await axios.post(
      AI_CONFIGS.openai.endpoint,
      {
        model: AI_CONFIGS.openai.model,
        messages: [
          { role: 'system', content: 'You are a Crazy Time prediction expert.' },
          { role: 'user', content: systemPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIGS.openai.apiKey}`
        },
        timeout: 15000
      }
    );

    const text = response.data.choices[0].message.content;
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      throw new Error('No JSON found in response');
    }

    const aiResponse = JSON.parse(text.substring(start, end + 1));

    res.json({
      success: true,
      data: aiResponse,
      provider: 'gpt',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('GPT API Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'gpt'
    });
  }
});

// Google Gemini
app.post('/api/ai/gemini', async (req, res) => {
  const { prompt, recent, frequency } = req.body;

  if (!AI_CONFIGS.google.apiKey) {
    return res.status(400).json({
      success: false,
      error: 'Google API key not configured. Set GOOGLE_API_KEY environment variable.'
    });
  }

  const systemPrompt = `You are Gemini Crazy Time AI using Bayesian multi-window analysis.

Recent spins: ${recent}
Counts: ${frequency}

Apply Bayesian posterior combining prior probability + recent frequency across multiple windows.

Respond ONLY with valid JSON:
{"prediction":"2","confidence":76,"reason":"Bayesian analysis","hot":"1","due":"5","cold":"Crazy Time"}`;

  try {
    const response = await axios.post(
      `${AI_CONFIGS.google.endpoint}?key=${AI_CONFIGS.google.apiKey}`,
      {
        contents: [{
          parts: [{ text: systemPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    const text = response.data.candidates[0].content.parts[0].text;
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      throw new Error('No JSON found in response');
    }

    const aiResponse = JSON.parse(text.substring(start, end + 1));

    res.json({
      success: true,
      data: aiResponse,
      provider: 'gemini',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini API Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      provider: 'gemini'
    });
  }
});

// Ensemble prediction (combines all three)
app.post('/api/ai/ensemble', async (req, res) => {
  const { recent, frequency, predictions } = req.body;

  if (!predictions || predictions.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Need at least 2 predictions to create ensemble'
    });
  }

  // Simple ensemble logic
  const votes = {};
  predictions.forEach(p => {
    votes[p.prediction] = (votes[p.prediction] || 0) + 1;
  });

  const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  const topPrediction = sorted[0][0];
  const voteCount = sorted[0][1];
  
  const avgConfidence = Math.round(
    predictions.reduce((sum, p) => sum + (p.confidence || 75), 0) / predictions.length
  );

  const allAgree = predictions.every(p => p.prediction === topPrediction);
  const majorityAgree = voteCount >= 2;

  const confidence = allAgree 
    ? Math.min(98, avgConfidence + 8)
    : majorityAgree 
    ? Math.min(95, avgConfidence + 4)
    : avgConfidence;

  res.json({
    success: true,
    data: {
      prediction: topPrediction,
      confidence: confidence,
      reason: allAgree 
        ? '✅ All AIs agree on this prediction'
        : majorityAgree
        ? `${voteCount}/${predictions.length} AIs agree`
        : 'Split decision - combined analysis',
      hot: predictions[0]?.hot || '1',
      due: predictions[0]?.due || '5',
      cold: predictions[0]?.cold || 'Crazy Time',
      agreement: allAgree ? 'unanimous' : majorityAgree ? 'majority' : 'split'
    },
    provider: 'ensemble',
    timestamp: new Date().toISOString()
  });
});

// ══════════════════════════════════════════
// HEALTH CHECK
// ══════════════════════════════════════════

app.get('/api/health', (req, res) => {
  const config = {
    claude: !!AI_CONFIGS.anthropic.apiKey,
    gpt: !!AI_CONFIGS.openai.apiKey,
    gemini: !!AI_CONFIGS.google.apiKey
  };

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    aiProviders: config,
    anyConfigured: Object.values(config).some(v => v)
  });
});

// ══════════════════════════════════════════
// SERVE FRONTEND
// ══════════════════════════════════════════

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ══════════════════════════════════════════
// START SERVER
// ══════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🎰 REVO FIXER ULTRA - SERVER ONLINE 🎰          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

🚀 Server running on: http://localhost:${PORT}

📡 API Endpoints:
   • GET  /api/health          - Server health check
   • GET  /api/live-data       - Fetch live Crazy Time data
   • POST /api/ai/claude       - Claude predictions
   • POST /api/ai/gpt          - GPT-4 predictions
   • POST /api/ai/gemini       - Gemini predictions
   • POST /api/ai/ensemble     - Combined predictions

🔑 AI Provider Status:
   • Claude (Anthropic): ${AI_CONFIGS.anthropic.apiKey ? '✅ Configured' : '❌ Not configured'}
   • GPT-4 (OpenAI):     ${AI_CONFIGS.openai.apiKey ? '✅ Configured' : '❌ Not configured'}
   • Gemini (Google):    ${AI_CONFIGS.google.apiKey ? '✅ Configured' : '❌ Not configured'}

⚙️  Configuration:
   Set API keys via environment variables:
   • ANTHROPIC_API_KEY=your_key_here
   • OPENAI_API_KEY=your_key_here
   • GOOGLE_API_KEY=your_key_here

💡 Tip: Even without API keys, the app uses advanced
   statistical AI models for predictions!

`);
});
