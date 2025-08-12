# MaxEvo AI Agent Platform

A single public agent ("Max") that orchestrates multiple models via a tiered, cost-aware router, supports Genius Mode (Serper deep dive), QC Mode (quick/deep), Honesty Mode (behavioral bluntness, no overlay), multi-agent orchestration, persistent memory, task scheduling, and a Chat↔Workspace UI with usage limits by plan.

## Features

- **Single Agent Interface**: One public agent "Max" with unified voice
- **Genius Mode**: Deep research pipeline with Serper integration
- **QC Mode**: Quality control with quick (≤600 tokens) and deep (≤2000 tokens) analysis
- **Honesty Mode**: Deterministic behavioral bluntness with no overlay
- **Multi-Agent Orchestration**: Specialized agents (researcher, writer, verifier, scheduler)
- **Persistent Memory**: Postgres-backed memory system with embeddings stub
- **Task Scheduling**: Cron-based job scheduling with delayed execution
- **Workspace UI**: Real-time SSE streaming with widget rendering
- **Usage Limits**: Plan-based limits for Genius/QC modes
- **Cost-Aware Routing**: Automatic selection of cheapest appropriate models

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Serper API key (for Genius mode)

### Installation

```bash
# Clone and install
git clone <repository>
cd maxevo-main
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL and API keys

# Set up database
npm run db:push

# Start development server
npm run dev
```

### First Test

```bash
# Check health
curl http://localhost:3000/api/health

# Test chat endpoint
curl -X POST http://localhost:3000/api/chat \\
  -H "Content-Type: application/json" \\
  -H "X-User-ID: demo-user" \\
  -d '{
    "messages": [{"role": "user", "content": "Plan my day"}],
    "genius_mode": false,
    "qc_mode": "off", 
    "honesty_mode": true,
    "view_mode": "workspace"
  }'
```

## API Endpoints

- `POST /api/chat` - Main chat interface with mode controls
- `GET /v1/workspace/stream/:jobId` - SSE workspace updates  
- `GET /api/health` - System health and provider status

## Configuration

### Models (src/config/models.yaml)
- Cost-aware routing with role-based model selection
- Supports OpenAI and Anthropic models
- Configurable unit costs and context limits

### Policy (src/config/policy.yaml)
- Token budgets and latency limits
- Plan-based usage limits (free/starter/pro)
- Genius and QC mode constraints

## Architecture

```
src/
├── config/           # YAML configuration files
├── types/           # TypeScript type definitions
├── schemas/         # Zod validation schemas
├── orchestrator/    # Core orchestration logic
│   ├── router.ts    # Cost-aware model routing
│   ├── unify.ts     # Voice unification & honesty mode
│   ├── genius/      # Serper research pipeline
│   ├── qc/          # Quality control modes  
│   ├── agents/      # Multi-agent coordinator
│   ├── memory/      # Persistent memory store
│   └── scheduler/   # Task scheduling system
├── lib/            # Utilities (retrieval, usage, cache)
├── routes/         # Express route handlers
└── scheduler/      # Cron job management
```

## Development

```bash
# Run tests
npm test

# Build for production  
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `SERPER_API_KEY` - Serper API key for Genius mode

Optional:
- `MAXEVO_DATA_DIR` - Data directory (default: /data)
- `ADJUDICATOR_MODEL` - Override adjudicator model
- `PORT` - Server port (default: 3000)

Incident flags:
- `SINGLE_MODEL_ONLY=true` - Use single model only
- `DISABLE_RETRIEVAL=true` - Disable web retrieval

## Usage Limits

### Plan Limits (monthly)
- **Free**: 5 Genius, 10 QC
- **Starter**: 30 Genius, 60 QC  
- **Pro**: 120 Genius, 240 QC

### Mode Constraints
- **Quick QC**: ≤600 tokens, 1 loop
- **Deep QC**: ≤2000 tokens, ≤2 repairs, ≤5 sources
- **Genius**: ≤7 sources, 120 tokens per source summary

## License

MIT License