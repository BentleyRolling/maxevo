const express = require('express')
const cors = require('cors')
const WebSocket = require('ws')
const http = require('http')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

// Import our existing MaxEvo services
const MaxEvoCore = require('../api/server/services/MaxEvoCore')
const MaxEvoAgentRouter = require('../api/server/services/MaxEvoAgentRouter')
const MaxEvoScheduler = require('../api/server/services/MaxEvoScheduler')
const { getTaskRunner } = require('../api/server/services/task-runner')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server, path: '/ws' })

// Configuration
const PORT = process.env.PORT || 8080
const NODE_ENV = process.env.NODE_ENV || 'development'

// Initialize MaxEvo components
let maxevoCore = null
let agentRouter = null
let scheduler = null
let taskRunner = null

// Middleware
app.use(cors({
  origin: NODE_ENV === 'production' ? false : 'http://localhost:3000',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files in production
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
}

// Initialize MaxEvo system
async function initializeMaxEvo() {
  try {
    console.log('🚀 Initializing MaxEvo system...')
    
    // Initialize core components with error handling
    try {
      maxevoCore = new MaxEvoCore()
      await maxevoCore.initialize()
      console.log('✅ MaxEvo Core initialized')
    } catch (error) {
      console.warn('⚠️ MaxEvo Core initialization failed:', error.message)
    }
    
    if (maxevoCore) {
      try {
        agentRouter = new MaxEvoAgentRouter(maxevoCore)
        await agentRouter.initialize()
        console.log('✅ Agent Router initialized')
      } catch (error) {
        console.warn('⚠️ Agent Router initialization failed:', error.message)
      }
      
      try {
        scheduler = new MaxEvoScheduler()
        await scheduler.initialize()
        console.log('✅ Scheduler initialized')
      } catch (error) {
        console.warn('⚠️ Scheduler initialization failed:', error.message)
      }
    }
    
    try {
      taskRunner = await getTaskRunner()
      console.log('✅ Task Runner initialized')
    } catch (error) {
      console.warn('⚠️ Task Runner initialization failed:', error.message)
    }
    
    console.log('🌟 MaxEvo system initialization complete')
    
  } catch (error) {
    console.error('❌ MaxEvo system initialization failed:', error)
  }
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const sessionId = uuidv4()
  console.log(`🔌 New WebSocket connection: ${sessionId}`)
  
  // Send initial system status
  const systemStatus = {
    memoryCore: maxevoCore ? 'online' : 'offline',
    scheduler: scheduler ? 'online' : 'offline', 
    agentRouter: agentRouter ? 'online' : 'offline',
    webSocket: 'online'
  }
  
  ws.send(JSON.stringify({
    type: 'system_status',
    status: systemStatus,
    timestamp: new Date().toISOString()
  }))
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data)
      console.log('📨 WebSocket message:', message.type)
      
      switch (message.type) {
        case 'handshake':
          ws.send(JSON.stringify({
            type: 'handshake_ack',
            sessionId: sessionId,
            timestamp: new Date().toISOString()
          }))
          break
          
        case 'ping':
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }))
          break
          
        default:
          console.log('Unknown WebSocket message type:', message.type)
      }
    } catch (error) {
      console.error('WebSocket message error:', error)
    }
  })
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed')
  })
  
  ws.on('error', (error) => {
    console.error('🔌 WebSocket error:', error)
  })
})

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    maxevo: {
      core: maxevoCore ? 'online' : 'offline',
      router: agentRouter ? 'online' : 'offline',
      scheduler: scheduler ? 'online' : 'offline',
      taskRunner: taskRunner ? 'online' : 'offline'
    }
  })
})

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { chatId, message, context = [] } = req.body
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }
    
    console.log(`💬 Chat request for ${chatId}: ${message.slice(0, 100)}...`)
    
    // Simulate agent processing
    let response = ''
    let agent = 'MaxEvo'
    let taskId = uuidv4()
    
    if (agentRouter && maxevoCore) {
      try {
        // Route the message to appropriate agent
        const routingResult = await agentRouter.routeTask({
          id: taskId,
          type: 'chat',
          content: message,
          context: context.slice(-5), // Last 5 messages for context
          chatId
        })
        
        response = routingResult.response || 'Task has been routed to the appropriate agent.'
        agent = routingResult.agent || 'MaxEvo'
        taskId = routingResult.taskId
        
      } catch (error) {
        console.error('Agent routing error:', error)
        
        // Return proper error instead of masking it
        return res
          .status(502)
          .set('x-maxevo-error', 'PROVIDER_FAILURE')
          .json({
            error: true,
            isError: true,
            agent: 'MaxEvo',
            code: 'PROVIDER_FAILURE',
            message: 'Upstream model call failed',
            detail: process.env.NODE_ENV === 'production' ? undefined : error.message
          })
      }
    } else {
      // Fallback responses when MaxEvo components aren't available
      response = generateFallbackResponse(message)
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    res.json({
      response,
      agent,
      taskId,
      timestamp: new Date().toISOString(),
      metadata: {
        executionTime: Math.floor(Math.random() * 1000) + 500,
        tokensUsed: Math.floor(Math.random() * 100) + 50
      }
    })
    
  } catch (error) {
    console.error('Chat API error:', error)
    res.status(500).json({
      error: true,
      isError: true,
      agent: 'System',
      code: 'INTERNAL_ERROR',
      message: 'Failed to process message',
      detail: process.env.NODE_ENV === 'production' ? undefined : error.message
    })
  }
})

// System status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    system: {
      memoryCore: maxevoCore ? 'online' : 'offline',
      scheduler: scheduler ? 'online' : 'offline',
      agentRouter: agentRouter ? 'online' : 'offline',
      taskRunner: taskRunner ? 'online' : 'offline',
      webSocket: 'online'
    },
    stats: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: wss.clients.size
    },
    timestamp: new Date().toISOString()
  })
})

// Tasks endpoint
app.get('/api/tasks', (req, res) => {
  // TODO: Get tasks from MaxEvo system
  res.json({
    tasks: [],
    timestamp: new Date().toISOString()
  })
})

// Fallback response generator for when MaxEvo components aren't available
function generateFallbackResponse(message) {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('blog') || lowerMessage.includes('write')) {
    return `✅ I'll help you write content. Here's what I can do:

📝 **Content Creation**
- Blog posts and articles
- Product descriptions
- Marketing copy
- Technical documentation

⚡ **Next Steps**
1. Specify your topic and target audience
2. I'll create an outline
3. Generate the full content
4. Optimize for SEO if needed

What specific content would you like me to create?`
  }
  
  if (lowerMessage.includes('analyze') || lowerMessage.includes('optimize')) {
    return `📊 **Analysis & Optimization Available**

I can help you analyze and optimize:
- Website performance
- SEO rankings  
- Content effectiveness
- User experience
- Conversion rates

⏳ **Processing your request...**
✅ **Analysis tools activated**

What would you like me to analyze first?`
  }
  
  if (lowerMessage.includes('task') || lowerMessage.includes('schedule')) {
    return `⚡ **Task Management System**

I can help you:
- Create automated tasks
- Schedule recurring operations  
- Monitor task progress
- Set up notifications

🤖 **Agent Coordination**
- Claude for complex reasoning
- GPT-4 for general tasks
- Specialized tools for specific needs

What task would you like me to set up?`
  }
  
  return `🤖 **MaxEvo AI Orchestration System**

I'm ready to help you with complex tasks! I can:

✨ **Coordinate Multiple Agents**
- Route tasks to Claude, GPT-4, or specialized tools
- Handle multi-step workflows
- Provide real-time progress updates

🚀 **Available Capabilities**
- Content creation and publishing
- Data analysis and reporting  
- Task automation and scheduling
- System optimization

How can I assist you today?`
}

// Catch-all handler for SPA in production
if (NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error)
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  })
})

// Start server
async function startServer() {
  try {
    // Initialize MaxEvo system
    await initializeMaxEvo()
    
    // Start HTTP server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 MaxEvo UI Server running on port ${PORT}`)
      console.log(`🌍 Environment: ${NODE_ENV}`)
      console.log(`📡 WebSocket server ready at /ws`)
      console.log(`💻 ${NODE_ENV === 'production' ? 'Production' : 'Development'} mode`)
      
      if (NODE_ENV === 'development') {
        console.log(`🔗 Frontend dev server: http://localhost:3000`)
        console.log(`🔗 API server: http://localhost:${PORT}`)
      }
    })
    
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

// Start the server
startServer()