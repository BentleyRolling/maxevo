const MaxEvoCore = require('./MaxEvoCore')
const MaxEvoAgentRouter = require('./MaxEvoAgentRouter')
const MaxEvoScheduler = require('./MaxEvoScheduler')
const MaxEvoMemoryCore = require('./MaxEvoMemoryCore')

/**
 * Initialize the complete MaxEvo system
 * Orchestrates startup of all components and establishes connections
 */
class MaxEvoInitializer {
  constructor(config = {}) {
    this.config = {
      enableMemory: true,
      enableScheduler: true,
      enableAgentRouter: true,
      memoryPath: 'data/memory',
      ...config
    }
    
    this.components = {
      core: null,
      memoryCore: null,
      scheduler: null,
      agentRouter: null
    }
    
    this.initialized = false
  }

  /**
   * Initialize all MaxEvo components
   */
  async initialize() {
    try {
      console.log('🚀 Starting MaxEvo system initialization...')
      
      // 1. Initialize Core (central orchestrator)
      await this.initializeCore()
      
      // 2. Initialize Memory Core (if enabled)
      if (this.config.enableMemory) {
        await this.initializeMemoryCore()
      }
      
      // 3. Initialize Scheduler (if enabled)
      if (this.config.enableScheduler) {
        await this.initializeScheduler()
      }
      
      // 4. Initialize Agent Router (if enabled)
      if (this.config.enableAgentRouter) {
        await this.initializeAgentRouter()
      }
      
      // 5. Setup inter-component communication
      await this.setupInterComponentCommunication()
      
      // 6. Perform system health check
      await this.performHealthCheck()
      
      this.initialized = true
      console.log('🌟 MaxEvo system initialization complete!')
      
      return this.components
      
    } catch (error) {
      console.error('❌ MaxEvo system initialization failed:', error)
      await this.cleanup()
      throw error
    }
  }

  /**
   * Initialize MaxEvo Core
   */
  async initializeCore() {
    try {
      console.log('🔧 Initializing MaxEvo Core...')
      
      this.components.core = new MaxEvoCore({
        maxConcurrentTasks: 10,
        taskTimeout: 30000,
        retryAttempts: 3
      })
      
      await this.components.core.initialize()
      console.log('✅ MaxEvo Core initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize MaxEvo Core:', error)
      throw error
    }
  }

  /**
   * Initialize Memory Core
   */
  async initializeMemoryCore() {
    try {
      console.log('🧠 Initializing Memory Core...')
      
      this.components.memoryCore = new MaxEvoMemoryCore(this.components.core, {
        memoryPath: this.config.memoryPath,
        maxConversationHistory: 1000,
        autoSave: true,
        saveInterval: 30000
      })
      
      await this.components.memoryCore.initialize()
      console.log('✅ Memory Core initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize Memory Core:', error)
      throw error
    }
  }

  /**
   * Initialize Scheduler
   */
  async initializeScheduler() {
    try {
      console.log('⏰ Initializing Scheduler...')
      
      this.components.scheduler = new MaxEvoScheduler(this.components.core, {
        maxConcurrentScheduledTasks: 5,
        defaultRetryDelay: 60000,
        maxRetries: 3
      })
      
      await this.components.scheduler.initialize()
      console.log('✅ Scheduler initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize Scheduler:', error)
      throw error
    }
  }

  /**
   * Initialize Agent Router
   */
  async initializeAgentRouter() {
    try {
      console.log('🎯 Initializing Agent Router...')
      
      this.components.agentRouter = new MaxEvoAgentRouter(this.components.core, {
        defaultAgent: 'claude-3-sonnet',
        timeout: 30000,
        maxRetries: 3
      })
      
      await this.components.agentRouter.initialize()
      console.log('✅ Agent Router initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize Agent Router:', error)
      throw error
    }
  }

  /**
   * Setup communication between components
   */
  async setupInterComponentCommunication() {
    console.log('🔗 Setting up inter-component communication...')
    
    const { core, memoryCore, scheduler, agentRouter } = this.components
    
    if (core && memoryCore) {
      // Store completed tasks in memory
      core.on('task:completed', (task) => {
        memoryCore.storeTaskHistory(task)
      })
      
      // Store conversation messages
      core.on('task:submitted', (task) => {
        if (task.type === 'chat' && task.chatId) {
          memoryCore.storeConversation(task.chatId, {
            role: 'user',
            content: task.content,
            timestamp: task.createdAt
          })
        }
      })
    }
    
    if (core && scheduler) {
      // Schedule failed tasks for retry
      core.on('task:failed', (task) => {
        if (task.attempts < 3) {
          scheduler.scheduleTask({
            ...task,
            type: 'retry',
            originalTaskId: task.id
          }, new Date(Date.now() + 60000)) // Retry in 1 minute
        }
      })
    }
    
    console.log('✅ Inter-component communication configured')
  }

  /**
   * Perform system health check
   */
  async performHealthCheck() {
    console.log('🏥 Performing system health check...')
    
    const { core, memoryCore, scheduler, agentRouter } = this.components
    
    const healthStatus = {
      core: core ? core.getStatus() : { status: 'offline' },
      memoryCore: memoryCore ? memoryCore.isHealthy() : false,
      scheduler: scheduler ? scheduler.isHealthy() : false,
      agentRouter: agentRouter ? agentRouter.isHealthy() : false
    }
    
    console.log('📊 Health check results:', healthStatus)
    
    // Check for critical failures
    if (!healthStatus.core.initialized) {
      throw new Error('Core system failed health check')
    }
    
    console.log('✅ System health check passed')
    return healthStatus
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    if (!this.initialized) {
      return { status: 'not_initialized' }
    }
    
    const { core, memoryCore, scheduler, agentRouter } = this.components
    
    return {
      status: 'online',
      components: {
        core: core ? core.getStatus() : null,
        memoryCore: memoryCore ? memoryCore.getStats() : null,
        scheduler: scheduler ? scheduler.getStats() : null,
        agentRouter: agentRouter ? agentRouter.getStats() : null
      },
      systemInfo: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    }
  }

  /**
   * Process a chat message through the system
   */
  async processChatMessage(chatId, message, context = []) {
    if (!this.initialized) {
      throw new Error('MaxEvo system not initialized')
    }
    
    const { core, memoryCore } = this.components
    
    try {
      // Get conversation context from memory if available
      let conversationContext = context
      if (memoryCore) {
        conversationContext = memoryCore.getConversationContext(chatId, 5)
      }
      
      // Submit task to core
      const taskId = await core.submitTask({
        type: 'chat',
        content: message,
        chatId,
        context: conversationContext
      })
      
      // Wait for task completion (simplified for demo)
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Task timeout'))
        }, 30000)
        
        core.once('task:completed', (task) => {
          if (task.id === taskId) {
            clearTimeout(timeout)
            
            // Store AI response in memory
            if (memoryCore) {
              memoryCore.storeConversation(chatId, {
                role: 'assistant',
                content: task.result.response,
                agent: task.result.agent,
                timestamp: new Date()
              })
            }
            
            resolve(task.result)
          }
        })
        
        core.once('task:failed', (task, error) => {
          if (task.id === taskId) {
            clearTimeout(timeout)
            reject(error)
          }
        })
      })
      
    } catch (error) {
      console.error('❌ Chat message processing failed:', error)
      throw error
    }
  }

  /**
   * Cleanup and shutdown
   */
  async cleanup() {
    console.log('🛑 Cleaning up MaxEvo system...')
    
    const { core, memoryCore, scheduler, agentRouter } = this.components
    
    // Shutdown components in reverse order
    if (agentRouter) {
      // AgentRouter doesn't have shutdown method currently
    }
    
    if (scheduler) {
      await scheduler.shutdown()
    }
    
    if (memoryCore) {
      await memoryCore.shutdown()
    }
    
    if (core) {
      await core.shutdown()
    }
    
    console.log('✅ MaxEvo system cleanup complete')
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down MaxEvo system...')
    await this.cleanup()
    this.initialized = false
    console.log('✅ MaxEvo system shutdown complete')
  }
}

module.exports = MaxEvoInitializer