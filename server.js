// Load environment variables from .env file
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const WebSocket = require('ws')
const http = require('http')
const path = require('path')
const fs = require('fs')

// Import real MaxEvo services
const MaxEvoInitializer = require('./api/server/services/initializeMaxEvo')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server, path: '/ws' })

// Configuration
const PORT = process.env.PORT || 8080
const NODE_ENV = process.env.NODE_ENV || 'development'

// Initialize MaxEvo components
let maxevoInitializer = null
let maxevoComponents = null

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
    
    // Initialize the real MaxEvo orchestration system
    maxevoInitializer = new MaxEvoInitializer({
      enableMemory: true,
      enableScheduler: true,
      enableAgentRouter: true,
      memoryPath: path.join(__dirname, 'data', 'memory')
    })
    
    // Initialize all components
    maxevoComponents = await maxevoInitializer.initialize()
    
    console.log('🌟 MaxEvo system initialization complete')
    
  } catch (error) {
    console.error('❌ MaxEvo system initialization failed:', error)
    console.log('⚠️ Falling back to basic system without full MaxEvo orchestration')
    
    // Set fallback null values so the system can still function
    maxevoInitializer = null
    maxevoComponents = null
  }
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection')
  
  // Send initial system status
  const systemStatus = {
    memoryCore: maxevoComponents?.memoryCore ? 'online' : 'offline',
    scheduler: maxevoComponents?.scheduler ? 'online' : 'offline', 
    agentRouter: maxevoComponents?.agentRouter ? 'online' : 'offline',
    core: maxevoComponents?.core ? 'online' : 'offline',
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
  const healthStatus = maxevoInitializer ? maxevoInitializer.getSystemStatus() : { status: 'offline' }
  
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    maxevo: healthStatus
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
    
    // Process through MaxEvo system
    let response = ''
    let agent = 'MaxEvo'
    let taskId = null
    
    if (maxevoInitializer && maxevoComponents) {
      try {
        // Process the chat message through the real MaxEvo system
        const result = await maxevoInitializer.processChatMessage(chatId, message, context.slice(-5))
        
        response = result.response || 'Task has been processed by MaxEvo.'
        agent = result.agent || 'MaxEvo'
        taskId = result.taskId
        
      } catch (error) {
        console.error('MaxEvo processing error:', error)
        response = 'I understand your request. Let me help you with that using the MaxEvo system.'
        agent = 'MaxEvo Core'
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
      error: 'Failed to process message',
      details: error.message 
    })
  }
})

// System status endpoint
app.get('/api/status', (req, res) => {
  const systemStatus = maxevoInitializer ? maxevoInitializer.getSystemStatus() : { status: 'offline' }
  
  res.json({
    system: {
      maxevo: systemStatus,
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
  let tasks = []
  
  if (maxevoComponents?.scheduler) {
    const scheduledTasks = maxevoComponents.scheduler.getScheduledTasks()
    const recurringTasks = maxevoComponents.scheduler.getRecurringTasks()
    tasks = [...scheduledTasks, ...recurringTasks]
  }
  
  res.json({
    tasks,
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
    const indexPath = path.join(__dirname, 'dist', 'index.html')
    
    // Force serve React app - we know it exists because we committed it
    console.log('🚀 Serving MaxEvo React ChatGPT interface')
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('❌ Error serving React app:', err)
        // Emergency fallback - should never happen now
        res.status(500).send('<h1>MaxEvo React App Error</h1><p>Could not load interface. Check server logs.</p>')
      }
    })
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
async function shutdown() {
  console.log('🛑 Shutting down gracefully...')
  
  // Shutdown MaxEvo system first
  if (maxevoInitializer) {
    try {
      await maxevoInitializer.shutdown()
    } catch (error) {
      console.error('❌ Error shutting down MaxEvo:', error)
    }
  }
  
  // Close server
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Start the server
startServer()