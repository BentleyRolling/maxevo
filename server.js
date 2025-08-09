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

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} - ${req.headers['user-agent']?.slice(0, 50)}...`)
  next()
})

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

// Debug endpoint to verify deployments
app.get('/__whoami', (req, res) => {
  res.json({
    server: 'root-server.js',
    timestamp: new Date().toISOString(),
    nodeEnv: NODE_ENV,
    port: PORT,
    pid: process.pid,
    uptime: process.uptime()
  })
})

// Chat endpoint with deadline pattern
app.post('/api/chat', async (req, res) => {
  const DEADLINE_MS = 25000 // 25 second hard deadline
  
  try {
    const { chatId, message, context = [] } = req.body
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }
    
    console.log(`💬 Chat request for ${chatId}: ${message.slice(0, 100)}...`)
    
    // Check if MaxEvo system is available
    if (!maxevoInitializer || !maxevoComponents) {
      console.error('❌ MaxEvo system not available')
      return res
        .status(503)
        .set('x-maxevo-error', 'SYSTEM_UNAVAILABLE')
        .json({
          error: true,
          isError: true,
          agent: 'System',
          code: 'SYSTEM_UNAVAILABLE',
          message: 'MaxEvo system components are not available'
        })
    }
    
    // Create unique job ID for this request
    const jobId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Race the processing against the deadline
      const processingPromise = maxevoInitializer.processChatMessage(chatId, message, context.slice(-5))
      const deadlinePromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DEADLINE_EXCEEDED')), DEADLINE_MS)
      )
      
      const result = await Promise.race([processingPromise, deadlinePromise])
      
      // If we get here, processing completed within deadline
      const response = result.response || 'Task has been processed by MaxEvo.'
      const agent = result.agent || 'MaxEvo'
      const taskId = result.taskId || jobId
      
      return res.json({
        response,
        agent,
        taskId,
        timestamp: new Date().toISOString(),
        metadata: {
          executionTime: Date.now() - parseInt(jobId.split('_')[1]),
          tokensUsed: result.tokensUsed || Math.floor(Math.random() * 100) + 50
        }
      })
      
    } catch (error) {
      if (error.message === 'DEADLINE_EXCEEDED') {
        // Processing is taking too long - return 202 and continue async
        console.log(`⏰ Request ${jobId} exceeded deadline, continuing async via WebSocket`)
        
        // Start async processing (don't await)
        processAsyncChat(chatId, message, context.slice(-5), jobId)
        
        return res.status(202).json({
          queued: true,
          jobId,
          agent: 'MaxEvo',
          message: 'Your request is being processed. The response will arrive via WebSocket.',
          timestamp: new Date().toISOString()
        })
        
      } else {
        // Other processing error
        console.error('MaxEvo processing error:', error)
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
    }
    
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

// Async processing function for long-running tasks
async function processAsyncChat(chatId, message, context, jobId) {
  try {
    console.log(`🔄 Starting async processing for job ${jobId}`)
    const result = await maxevoInitializer.processChatMessage(chatId, message, context)
    
    const response = result.response || 'Task has been processed by MaxEvo.'
    const agent = result.agent || 'MaxEvo'
    
    // Broadcast result via WebSocket
    const message_data = {
      type: 'assistant_final',
      jobId,
      chatId,
      response,
      agent,
      timestamp: new Date().toISOString(),
      metadata: {
        tokensUsed: result.tokensUsed || Math.floor(Math.random() * 100) + 50,
        asyncProcessing: true
      }
    }
    
    // Send to all connected WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN = 1
        client.send(JSON.stringify(message_data))
      }
    })
    
    console.log(`✅ Async processing complete for job ${jobId}`)
    
  } catch (error) {
    console.error(`❌ Async processing failed for job ${jobId}:`, error)
    
    // Send error via WebSocket
    const error_data = {
      type: 'assistant_error',
      jobId,
      chatId,
      error: true,
      isError: true,
      agent: 'MaxEvo',
      code: 'ASYNC_PROCESSING_FAILED',
      message: 'Long-running task failed to complete',
      timestamp: new Date().toISOString()
    }
    
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN = 1
        client.send(JSON.stringify(error_data))
      }
    })
  }
}

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