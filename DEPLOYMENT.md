# MaxEvo AI Operating System - DigitalOcean Deployment Guide

## 🚀 Quick Deployment to DigitalOcean App Platform

### Prerequisites
- DigitalOcean account with App Platform access
- GitHub repository: `BentleyRolling/maxevo` (already configured)
- All code has been pushed to the `main` branch

### Step 1: Create New App on DigitalOcean

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Choose **"GitHub"** as your source
4. Select repository: `BentleyRolling/maxevo`
5. Branch: `main`
6. **IMPORTANT**: Check **"Autodeploy code changes"**

### Step 2: App Configuration Method

**Option A: Use App Spec (Recommended)**
1. In the app creation flow, look for **"Edit App Spec"** or **"Import from Spec"**
2. Copy the contents of `.do/app.yaml` from the repository
3. Paste it into the App Spec editor
4. Click **"Save"** and proceed

**Option B: Manual Configuration**
If you can't find the App Spec option:

1. **Service Configuration:**
   - Service Type: **Web Service**
   - Service Name: `maxevo-app`
   - Environment: **Node.js**
   - Build Command:
     ```bash
     echo "🚀 Starting MaxEvo build process..." && \
     echo "Node version: $(node --version)" && \
     echo "NPM version: $(npm --version)" && \
     cd api && npm ci --only=production --no-audit --no-fund --progress=false && \
     echo "✅ API dependencies installed" && \
     cd ../client && npm ci --only=production --no-audit --no-fund --progress=false && \
     echo "🔨 Building client..." && npm run build && \
     echo "✅ Client build completed"
     ```
   - Run Command:
     ```bash
     echo "🌟 Starting MaxEvo AI Operating System..." && \
     cd api && node server/index.js
     ```
   - HTTP Port: `8080`

2. **Instance Configuration:**
   - Instance Type: **Basic**
   - Instance Size: **$5/month (basic-xxs)**
   - Instance Count: **1**

### Step 3: Environment Variables

Add these environment variables in the DigitalOcean App Platform interface:

#### Required Variables
```bash
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
TRUST_PROXY=1
APP_TITLE=MaxEvo AI Operating System
CUSTOM_FOOTER=Powered by MaxEvo Multi-Agent System
```

#### Security Variables (Mark as SECRET)
```bash
JWT_SECRET=maxevo-jwt-secret-2024-production-deployment-secure-key-change-this
JWT_REFRESH_SECRET=maxevo-refresh-secret-2024-production-deployment-secure-key-change-this
CREDS_KEY=maxevo-creds-key-2024-secure-32-char
CREDS_IV=maxevo-iv-16-char
```

#### MaxEvo Configuration
```bash
MAXEVO_ENABLED=true
MAXEVO_MEMORY_LIMIT=1000
MAXEVO_TASK_TIMEOUT=300000
MAXEVO_RESURRECTION_ENABLED=true
MAXEVO_TERMINAL_ENABLED=true
MAXEVO_MULTIAGENT_ENABLED=true
MAXEVO_FAILSAFE_MODE=true
MAXEVO_MOCK_AGENTS=true
MAXEVO_STANDALONE_MODE=true
```

#### Optional Variables
```bash
ALLOW_REGISTRATION=true
ALLOW_SOCIAL_LOGIN=false
LOG_LEVEL=info
CONSOLE_JSON=true
FILE_UPLOAD_PATH=/tmp/uploads
WEBSOCKET_ENABLED=true
```

### Step 4: Health Check Configuration

1. **HTTP Health Check:**
   - Path: `/health`
   - Initial Delay: **60 seconds**
   - Period: **30 seconds** 
   - Timeout: **10 seconds**
   - Failure Threshold: **3**

### Step 5: Deploy

1. Review all settings
2. Click **"Create Resources"**
3. Wait for deployment (5-10 minutes)

## 🔍 Monitoring Deployment

### Build Logs
Watch the build logs for:
- ✅ Node.js and npm versions detected
- ✅ API dependencies installed
- ✅ Client dependencies installed  
- ✅ Client build completed
- ✅ MaxEvo services verified

### Runtime Logs
Watch for these startup messages:
- 🌟 MaxEvo AI Operating System starting
- 📡 Server listening on port 8080
- 🤖 MaxEvo AI Operating System is now online!
- ✅ All MaxEvo components initialized

### Health Check Endpoints

Once deployed, test these endpoints:

1. **Basic Health:** `https://your-app-url.ondigitalocean.app/health`
   - Should return: `OK`

2. **MaxEvo Status:** `https://your-app-url.ondigitalocean.app/api/mcp/status`
   - Should return MaxEvo system status

3. **Main Application:** `https://your-app-url.ondigitalocean.app`
   - Should show MaxEvo AI Operating System interface

## 🛠️ Troubleshooting

### Common Issues

**Build Fails with "Module not found"**
- Check that all MaxEvo services are in the repository
- Verify `api/package.json` includes all dependencies

**Server won't start - "Port already in use"**
- Ensure `PORT=8080` and `HOST=0.0.0.0` are set
- Check no other processes are using the port

**Health check fails**
- Wait 60 seconds for initial startup
- Check server logs for startup messages
- Verify `/health` endpoint is accessible

**MaxEvo features not working**
- Check environment variables are set correctly
- Verify `MAXEVO_ENABLED=true`
- Review server logs for initialization messages

### Debug Commands

If deployment fails, check these in the DigitalOcean console:

```bash
# Check Node.js environment
node --version
npm --version

# Verify file structure
ls -la api/
ls -la api/server/services/MaxEvo*.js

# Test server startup
cd api && node -c server/index.js

# Check environment variables
env | grep -E "(NODE_ENV|PORT|MAXEVO_)"
```

## 🔧 Advanced Configuration

### Database Connection (Optional)
To add MongoDB support:
1. Add DigitalOcean Managed Database
2. Set `MONGO_URI` environment variable
3. Remove `MAXEVO_STANDALONE_MODE=true`

### API Keys (Optional) 
To enable actual AI agents:
1. Add `CLAUDE_API_KEY` (Anthropic)
2. Add `OPENAI_API_KEY` (OpenAI)
3. Set `MAXEVO_MOCK_AGENTS=false`

### Custom Domain (Optional)
1. Add domain in DigitalOcean settings
2. Update `DOMAIN_CLIENT` and `DOMAIN_SERVER` variables

## 🎯 Success Criteria

Deployment is successful when:
- ✅ Build completes without errors
- ✅ Health check endpoint returns `OK`
- ✅ MaxEvo interface loads at app URL
- ✅ Server logs show all components online
- ✅ No error messages in deployment logs

## 📞 Support

If deployment fails:
1. Check the build and runtime logs in DigitalOcean
2. Verify all environment variables are set
3. Ensure the GitHub repository is accessible
4. Review the troubleshooting section above

**The deployment is now optimized and should work successfully! 🚀**