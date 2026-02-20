# REVO FIXER ULTRA - Server Edition

🎰 **Real AI-Powered Crazy Time Predictor with Server-Side Proxy**

## Features

✅ **Real AI Integration**
- Claude (Anthropic) - Markov chain analysis
- GPT-4 (OpenAI) - Pattern recognition
- Gemini (Google) - Bayesian analysis
- Ensemble AI - Combined predictions

✅ **Server-Side Proxy**
- Bypasses CORS restrictions
- Secure API key management
- Multiple data source fallbacks
- Real-time live data fetching

✅ **Advanced Statistical Fallback**
- Works without API keys
- Markov chain modeling
- Frequency gap analysis
- Bayesian posterior calculation

✅ **Live Data Integration**
- Real-time Crazy Time results
- Multiple data sources
- Automatic failover
- Frequency analysis

## Quick Start

### 1. Installation

```bash
# Clone or download the project
cd crazy-time-predictor

# Install dependencies
npm install
```

### 2. Configuration (Optional)

Set your AI API keys as environment variables:

```bash
# Linux/Mac
export ANTHROPIC_API_KEY="your_claude_api_key_here"
export OPENAI_API_KEY="your_openai_api_key_here"
export GOOGLE_API_KEY="your_google_api_key_here"

# Windows (Command Prompt)
set ANTHROPIC_API_KEY=your_claude_api_key_here
set OPENAI_API_KEY=your_openai_api_key_here
set GOOGLE_API_KEY=your_google_api_key_here

# Windows (PowerShell)
$env:ANTHROPIC_API_KEY="your_claude_api_key_here"
$env:OPENAI_API_KEY="your_openai_api_key_here"
$env:GOOGLE_API_KEY="your_google_api_key_here"
```

**Note:** The app works WITHOUT API keys using advanced statistical models!

### 3. Start Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### 4. Access Application

Open your browser and navigate to:
```
http://localhost:3000
```

## How to Get API Keys (Optional)

### Claude (Anthropic)
1. Visit: https://console.anthropic.com/
2. Sign up for an account
3. Go to API Keys section
4. Create a new API key
5. Copy and set as `ANTHROPIC_API_KEY`

**Pricing:** Pay-as-you-go, ~$0.003 per prediction

### GPT-4 (OpenAI)
1. Visit: https://platform.openai.com/
2. Create an account
3. Add payment method
4. Go to API Keys
5. Create new secret key
6. Copy and set as `OPENAI_API_KEY`

**Pricing:** Pay-as-you-go, ~$0.002 per prediction

### Gemini (Google)
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Create API key
4. Copy and set as `GOOGLE_API_KEY`

**Pricing:** Free tier available, then pay-as-you-go

## Environment Variables

Create a `.env` file in the project root (optional):

```env
PORT=3000
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
GOOGLE_API_KEY=AIzaxxxxx
```

Or use the `.env.example` template:

```bash
cp .env.example .env
# Edit .env with your keys
```

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and configured AI providers.

### Live Data
```
GET /api/live-data
```
Fetches real-time Crazy Time results from multiple sources.

### AI Predictions
```
POST /api/ai/claude
POST /api/ai/gpt
POST /api/ai/gemini
POST /api/ai/ensemble
```

**Request Body:**
```json
{
  "recent": "1, 2, 5, 10, Pachinko...",
  "frequency": "1:25/60, 2:15/60..."
}
```

## Project Structure

```
crazy-time-predictor/
├── server.js              # Node.js server with AI proxy
├── package.json           # Dependencies
├── public/
│   ├── index.html        # Frontend UI
│   └── app.js            # Client-side logic
├── .env.example          # Environment template
└── README.md             # This file
```

## Deployment

### Deploy to Heroku

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set ANTHROPIC_API_KEY=your_key
heroku config:set OPENAI_API_KEY=your_key
heroku config:set GOOGLE_API_KEY=your_key

# Deploy
git push heroku main

# Open
heroku open
```

### Deploy to Railway

1. Visit: https://railway.app/
2. Connect your GitHub repository
3. Add environment variables in dashboard
4. Deploy automatically

### Deploy to Render

1. Visit: https://render.com/
2. Create new Web Service
3. Connect repository
4. Add environment variables
5. Deploy

## Development

### Run in development mode with auto-reload:

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when files change.

## How It Works

### 1. Client requests prediction
User clicks "GET PREDICTION" button

### 2. Server fetches live data
- Tries multiple data sources simultaneously
- Returns first successful response
- Fallback to statistical model if all fail

### 3. Server calls AI APIs
- Sends context to Claude, GPT-4, Gemini
- Each AI analyzes patterns differently
- Returns predictions with confidence scores

### 4. Ensemble combines results
- Aggregates all AI predictions
- Calculates consensus
- Returns combined recommendation

### 5. Client displays results
- Shows all 4 AI predictions
- Highlights consensus pick
- Updates live results feed

## Troubleshooting

### Server won't start
```bash
# Check if port 3000 is already in use
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Use different port
PORT=8080 npm start
```

### API calls failing
- Check API keys are set correctly
- Verify account has credits/billing enabled
- Check console for specific error messages
- App will fallback to statistical AI automatically

### No live data
- Server will use statistical model as fallback
- Check if data sources are accessible
- Verify network connection

## Advanced Configuration

### Custom Port
```bash
PORT=8080 npm start
```

### Enable Debug Logs
Edit `server.js` and add:
```javascript
const DEBUG = true;
```

### Add Custom Data Source
Edit `server.js` and add to `DATA_URLS` array:
```javascript
{
  url: 'https://your-api.com/data',
  parse: (data) => { /* your parser */ }
}
```

## License

MIT License - Free to use and modify

## Support

- GitHub Issues: [Report bugs]
- Telegram: [@RevoCrazyTime](https://t.me/RevoCrazyTime)
- Email: support@revo.ai

## Disclaimer

⚠️ **This tool is for entertainment and educational purposes only.**

- No prediction system can guarantee wins
- Past results do not predict future outcomes
- Gamble responsibly and within your means
- This is a statistical analysis tool, not financial advice

## Credits

- Evolution Gaming for Crazy Time
- Anthropic, OpenAI, Google for AI APIs
- Tracksino, LTC Casino for live data sources

---

**Made with 🎰 by REVO Team**

*Version 2.0.0 - Server Edition*
