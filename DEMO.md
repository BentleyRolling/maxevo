# MaxEvo Demo Instructions

## Quick Demo

1. **Start the server**:
```bash
# Set up environment
export DATABASE_URL="postgresql://user:pass@localhost:5432/maxevo"
export SERPER_API_KEY="your-key-here"  # Optional for Genius mode
export MAXEVO_DATA_DIR="/tmp/maxevo-data"

# Create data directory
mkdir -p $MAXEVO_DATA_DIR/cache

# Start server
npm start
```

2. **Test the endpoints**:

```bash
# Health check
curl http://localhost:3000/api/health

# Basic chat (standard mode)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-User-ID: demo-user" \
  -d '{
    "messages": [{"role": "user", "content": "Hello Max!"}],
    "genius_mode": false,
    "qc_mode": "off",
    "honesty_mode": false,
    "view_mode": "chat"
  }'

# Chat with Honesty Mode
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-User-ID: demo-user" \
  -d '{
    "messages": [{"role": "user", "content": "Tell me about AI"}],
    "genius_mode": false,
    "qc_mode": "off", 
    "honesty_mode": true,
    "view_mode": "chat"
  }'

# Chat with Quick QC
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-User-ID: demo-user" \
  -d '{
    "messages": [{"role": "user", "content": "Explain quantum computing"}],
    "genius_mode": false,
    "qc_mode": "quick",
    "honesty_mode": false,
    "view_mode": "workspace"
  }'

# Workspace streaming (open in browser or use curl)
curl -N http://localhost:3000/v1/workspace/stream/test-job-123
```

3. **Demo the features**:

### Timeline Widget Example
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-User-ID: demo-user" \
  -d '{
    "messages": [{"role": "user", "content": "Plan my day"}],
    "genius_mode": false,
    "qc_mode": "off",
    "honesty_mode": false,
    "view_mode": "workspace"
  }'
```

### Research with Genius Mode (requires SERPER_API_KEY)
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-User-ID: demo-user" \
  -d '{
    "messages": [{"role": "user", "content": "What are the latest developments in AI?"}],
    "genius_mode": true,
    "qc_mode": "deep",
    "honesty_mode": true,
    "view_mode": "workspace"
  }'
```

## Expected Response Format

All chat responses follow this envelope:

```json
{
  "agent": "Max",
  "message": "Response text here...",
  "workspace": {
    "jobId": "uuid-here",
    "widgets": [
      {
        "id": "widget-id",
        "type": "RichText|Table|CardList|Timeline|Form",
        "data": { /* widget-specific data */ }
      }
    ],
    "suggestedActions": [{"id": "retry"}, {"id": "export"}]
  },
  "meta": {
    "latency_ms": 1500,
    "tokens_estimated": 250,
    "models_used": ["standard-orchestrator"]
  }
}
```

## Usage Limits

The demo user starts with:
- 5 Genius mode uses per month
- 10 QC mode uses per month  

Limits reset monthly and are enforced per user ID.

## Troubleshooting

- **503 errors**: Check DATABASE_URL is accessible
- **402 errors**: Usage limits exceeded, try different user ID
- **No research results**: Add SERPER_API_KEY for Genius mode
- **Empty widgets**: Try view_mode: "workspace" instead of "chat"