# MaxEvo UI - AI Orchestration Interface

A ChatGPT-style interface for the MaxEvo AI Orchestration System.

## Recent Updates
- Added 25s deadline pattern to prevent 504 timeouts
- Implemented async WebSocket completion for long-running tasks  
- Enhanced AI client validation with fast probes

## Features

🎯 **ChatGPT-Style Interface**
- Familiar chat interface that users love
- Real-time message streaming
- Syntax highlighting and markdown support
- Agent status indicators

🤖 **Multi-Agent Orchestration**
- Smart routing between Claude, GPT-4, and specialized agents
- Real-time agent status and task progress
- Automatic fallback and error handling

📁 **Claude-Style Projects**
- File uploads per project
- Context-aware conversations
- Project-based memory and history

⚡ **Real-Time Features**
- WebSocket communication
- Live system status monitoring
- Task progress updates
- Agent collaboration display

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start backend (separate terminal)
npm start
```

### Production
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Architecture

- **Frontend**: React + TailwindCSS + Zustand
- **Backend**: Express + WebSocket + MaxEvo Services
- **Deployment**: DigitalOcean App Platform
- **Storage**: Local storage + MaxEvo state management

## API Endpoints

- `GET /health` - Health check
- `POST /api/chat` - Send chat message
- `GET /api/status` - System status
- `GET /api/tasks` - Task queue
- `WS /ws` - WebSocket connection

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 8080)
- `MAXEVO_ENABLED` - Enable MaxEvo integration
- `LOG_LEVEL` - Logging level

## Deployment

Deploy to DigitalOcean App Platform using the included `.do/app.yaml` configuration.

The app will automatically:
- Build the React frontend
- Start the Express backend
- Connect to MaxEvo services
- Serve the complete application on port 8080

## Usage Examples

```
User: "Write a blog post about AI and publish it to my website"
MaxEvo: ✅ I'll coordinate with Claude to write the content and handle the publishing.

User: "Optimize all my product descriptions for SEO"  
MaxEvo: 📊 Analyzing 34 products... ✅ Optimization complete with rollback option.

User: "Create a scheduled task to backup my data daily"
MaxEvo: ⚡ Task created and scheduled. Next execution: tomorrow at 2 AM.
```

Built with ❤️ by the MaxEvo team