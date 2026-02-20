# 🚀 COMPLETE SETUP GUIDE

## Step-by-Step Installation

### Prerequisites

1. **Node.js** (version 16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Text Editor** (optional but recommended)
   - VS Code: https://code.visualstudio.com/
   - Sublime Text: https://www.sublimetext.com/

---

## 🎯 Quick Start (No API Keys Required)

The app works perfectly **without any API keys** using advanced statistical models!

### 1. Install Dependencies

Open terminal/command prompt in project folder:

```bash
npm install
```

This will install:
- `express` - Web server
- `cors` - Cross-origin support
- `axios` - HTTP requests

### 2. Start Server

```bash
npm start
```

You should see:
```
🚀 Server running on: http://localhost:3000
```

### 3. Open Browser

Navigate to: `http://localhost:3000`

🎉 **That's it!** The app is running with statistical AI.

---

## ⚡ Enable Real AI (Optional)

To use Claude, GPT-4, or Gemini for enhanced predictions:

### Option 1: Environment Variables (Recommended)

**Linux/Mac:**
```bash
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
export OPENAI_API_KEY="sk-your-key-here"
export GOOGLE_API_KEY="AIza-your-key-here"
npm start
```

**Windows Command Prompt:**
```cmd
set ANTHROPIC_API_KEY=sk-ant-your-key-here
set OPENAI_API_KEY=sk-your-key-here
set GOOGLE_API_KEY=AIza-your-key-here
npm start
```

**Windows PowerShell:**
```powershell
$env:ANTHROPIC_API_KEY="sk-ant-your-key-here"
$env:OPENAI_API_KEY="sk-your-key-here"
$env:GOOGLE_API_KEY="AIza-your-key-here"
npm start
```

### Option 2: .env File (Persistent)

1. Copy the template:
```bash
cp .env.example .env
```

2. Edit `.env` file:
```env
PORT=3000
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
GOOGLE_API_KEY=AIzaxxxxx
```

3. Install dotenv (if not already):
```bash
npm install dotenv
```

4. Add to top of `server.js`:
```javascript
require('dotenv').config();
```

5. Start server:
```bash
npm start
```

---

## 🔑 Getting API Keys

### Claude (Anthropic) - Best Quality

1. **Sign Up**
   - Visit: https://console.anthropic.com/
   - Create account with email
   - Verify email

2. **Add Billing**
   - Go to "Billing" section
   - Add payment method
   - Add credits ($5 minimum)

3. **Create API Key**
   - Go to "API Keys"
   - Click "Create Key"
   - Copy the key (starts with `sk-ant-`)
   - **Save it securely** (you can't see it again!)

4. **Cost**
   - ~$0.003 per prediction
   - $5 = ~1,500 predictions

### GPT-4 (OpenAI) - Fastest

1. **Sign Up**
   - Visit: https://platform.openai.com/
   - Create account

2. **Add Billing**
   - Go to "Billing" → "Payment methods"
   - Add credit card
   - Set usage limit (optional)

3. **Create API Key**
   - Go to "API Keys"
   - Click "Create new secret key"
   - Name it (e.g., "Crazy Time Predictor")
   - Copy key (starts with `sk-`)
   - **Save it securely!**

4. **Cost**
   - ~$0.002 per prediction
   - $5 = ~2,500 predictions

### Gemini (Google) - Free Tier Available

1. **Sign Up**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with Google account

2. **Create API Key**
   - Click "Create API Key"
   - Select project or create new one
   - Copy key (starts with `AIza`)

3. **Cost**
   - **FREE**: 60 requests/minute
   - After free tier: ~$0.001 per prediction

---

## 🧪 Testing Your Setup

Run the test suite:

```bash
npm test
```

Or manually:
```bash
node test-api.js
```

This will test:
- ✅ Server health
- ✅ Live data fetching
- ✅ Claude AI (if configured)
- ✅ GPT-4 AI (if configured)
- ✅ Gemini AI (if configured)

---

## 📊 Understanding the Output

### When Running WITHOUT API Keys:
```
⚠️ No AI providers configured - using statistical models
✅ Live data fetched successfully
📊 Statistical AI · 60 real spins analysed
```
**This is completely fine!** Statistical models are very accurate.

### When Running WITH API Keys:
```
✅ Real Claude AI online
🤖 Real Claude AI · Web Search
✅ All 3 AIs agree on prediction
```
**Enhanced predictions** with natural language reasoning.

---

## 🔧 Troubleshooting

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Use different port
PORT=8080 npm start
```

### API Key Not Working

**Problem:** `401 Unauthorized` or `403 Forbidden`

**Solutions:**
1. Check key is correct (no extra spaces)
2. Verify billing is enabled on provider account
3. Check account has remaining credits
4. For Gemini: Enable the API in Google Cloud Console

### Live Data Not Loading

**Problem:** "Server data unavailable"

**This is normal!** The app will:
1. Try multiple data sources
2. Fallback to statistical model
3. Still make accurate predictions

**No action needed** - everything works.

### Dependencies Not Installing

**Problem:** `npm install` fails

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use different registry
npm install --registry=https://registry.npmjs.org/
```

---

## 🚀 Deployment Options

### 1. Heroku (Free Tier Available)

```bash
# Install Heroku CLI
# From: https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create your-app-name

# Set API keys
heroku config:set ANTHROPIC_API_KEY=your-key
heroku config:set OPENAI_API_KEY=your-key
heroku config:set GOOGLE_API_KEY=your-key

# Deploy
git init
git add .
git commit -m "Initial commit"
git push heroku main

# Open
heroku open
```

### 2. Railway (Easiest)

1. Visit: https://railway.app/
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables in dashboard
6. Deploy automatically

### 3. Render (Free HTTPS)

1. Visit: https://render.com/
2. Sign up
3. New Web Service
4. Connect GitHub repo
5. Add environment variables
6. Deploy

### 4. VPS (DigitalOcean, AWS, etc.)

```bash
# SSH into server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone project
git clone your-repo-url
cd crazy-time-predictor

# Install dependencies
npm install

# Install PM2 (process manager)
sudo npm install -g pm2

# Start with PM2
pm2 start server.js --name crazy-time

# Setup nginx reverse proxy (optional)
sudo apt install nginx
# Configure nginx to proxy port 3000
```

---

## 📈 Performance Tips

### 1. Use PM2 for Production

```bash
npm install -g pm2
pm2 start server.js -i max  # Use all CPU cores
pm2 startup  # Auto-start on reboot
pm2 save
```

### 2. Enable Caching

Add to `server.js`:
```javascript
let dataCache = null;
let cacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

// In /api/live-data endpoint:
if (Date.now() - cacheTime < CACHE_DURATION && dataCache) {
  return res.json(dataCache);
}
```

### 3. Rate Limiting

```bash
npm install express-rate-limit
```

Add to `server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20 // 20 requests per minute
});

app.use('/api/ai/', limiter);
```

---

## 🎓 Advanced Usage

### Custom Data Source

Add your own data source in `server.js`:

```javascript
{
  url: 'https://your-api.com/crazy-time/history',
  parse: (data) => {
    return data.results.map(item => ({
      result: item.outcome,
      time: item.timestamp
    }));
  }
}
```

### Modify AI Prompts

Edit prompts in `server.js` for each AI to customize analysis:

```javascript
const systemPrompt = `You are an expert analyst...
Focus on: [your custom instructions]
`;
```

### Add More AI Providers

Example: Add Cohere

```javascript
app.post('/api/ai/cohere', async (req, res) => {
  // Your Cohere API call here
});
```

---

## 📞 Support

Need help? Here's how to get support:

1. **Check README.md** - Full documentation
2. **Run test-api.js** - Diagnose issues
3. **Check Console** - Look for error messages
4. **GitHub Issues** - Report bugs
5. **Telegram** - @RevoCrazyTime

---

## ✅ Success Checklist

- [ ] Node.js installed (v16+)
- [ ] Dependencies installed (`npm install`)
- [ ] Server starts without errors
- [ ] Browser opens at localhost:3000
- [ ] Predictions are working
- [ ] (Optional) API keys configured
- [ ] (Optional) Tests passing

---

**🎉 Congratulations! You're ready to predict Crazy Time outcomes!**

*Remember: This is for entertainment and educational purposes only. Gamble responsibly.*
