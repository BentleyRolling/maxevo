# MaxEvo AI Orchestration System - Deployment Guide

## 🚀 Quick Deploy to DigitalOcean App Platform

### Step 1: Deploy from GitHub

1. **Log into DigitalOcean**: Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)

2. **Create New App**: 
   - Click "Create App"
   - Select "GitHub" as source
   - Choose repository: `BentleyRolling/maxevo`
   - Branch: `main`
   - Auto-deploy: ✅ Enabled

3. **Configure Build Settings**:
   - The app will automatically detect the configuration from `.do/app.yaml`
   - Build command: `npm ci && npm run build`
   - Run command: `node server.js`

### Step 2: Set Environment Variables

**Required API Keys** (configure in DigitalOcean App settings):

```bash
# OpenAI API Key (for GPT-4 integration)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Anthropic API Key (for Claude integration)  
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
```

**How to add API keys**:
1. Go to your app in DigitalOcean dashboard
2. Click "Settings" tab
3. Scroll to "Environment Variables"
4. Add each key as type "SECRET" (encrypted)

### Step 3: Deploy

1. **Deploy**: Click "Create Resources" - deployment takes ~3-5 minutes
2. **Monitor**: Watch build logs in DigitalOcean dashboard
3. **Access**: Use the provided app URL (e.g., `https://maxevo-ai-orchestration-xxxxx.ondigitalocean.app`)

---

## 🎯 System Architecture

### Backend Services
- **MaxEvoCore.js**: Central orchestration system
- **MaxEvoAgentRouter.js**: Intelligent AI agent routing
- **MaxEvoScheduler.js**: Task scheduling and automation
- **MaxEvoMemoryCore.js**: Persistent memory management
- **initializeMaxEvo.js**: System coordination

### Features
✅ **Real AI Responses**: Route messages to Claude or GPT-4 based on content analysis  
✅ **Persistent Memory**: Conversation history and system state  
✅ **Task Scheduling**: Automated maintenance and recurring tasks  
✅ **Health Monitoring**: System status and component health tracking  
✅ **WebSocket Support**: Real-time communication  

---

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Add your API keys to .env

# Start development server
npm run dev          # Frontend (port 3000)
npm run backend      # Backend (port 8080)
```

---

## 📊 Monitoring

- **Health Check**: `GET /health`
- **System Status**: `GET /api/status`
- **Tasks**: `GET /api/tasks`

---

## 🚨 Troubleshooting

**Build Fails**:
- Check Node.js version compatibility
- Verify all dependencies in package.json
- Check build logs for specific errors

**AI Responses Don't Work**:
- Verify API keys are set correctly in DigitalOcean
- Check that OPENAI_API_KEY and/or ANTHROPIC_API_KEY are configured
- Monitor app logs for API errors

**App Won't Start**:
- Check health check endpoint: `/health`
- Verify PORT environment variable is set to 8080
- Review application logs in DigitalOcean dashboard

---

## 💡 Next Steps

After deployment, you can:
1. **Test AI Integration**: Send messages through the chat interface
2. **Monitor Performance**: Use DigitalOcean metrics dashboard
3. **Scale Resources**: Upgrade instance size if needed
4. **Custom Domain**: Configure your own domain name
5. **Environment Variables**: Add additional configuration as needed

The MaxEvo system will automatically handle:
- Intelligent routing between Claude and GPT-4
- Conversation memory and context
- System health monitoring
- Graceful shutdown and restart