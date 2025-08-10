const EventEmitter = require('events')
const { v4: uuidv4 } = require('uuid')
const { normalizeUserInput } = require('./util/normalizeInput.js')

/**
 * MaxEvoCore - Central orchestration system for MaxEvo AI platform
 * Handles system initialization, component coordination, and state management
 */
class MaxEvoCore extends EventEmitter {
  constructor(config = {}) {
    super()
    this.config = {
      maxConcurrentTasks: 10,
      taskTimeout: 30000,
      retryAttempts: 3,
      ...config
    }
    
    this.state = {
      initialized: false,
      components: new Map(),
      activeTasks: new Map(),
      taskQueue: [],
      stats: {
        tasksProcessed: 0,
        tasksSucceeded: 0,
        tasksFailed: 0,
        uptime: Date.now()
      }
    }
    
    this.services = {
      agentRouter: null,
      scheduler: null,
      memoryCore: null,
      webSocket: null
    }
  }

  /**
   * Initialize the MaxEvo core system
   */
  async initialize() {
    try {
      console.log('🚀 Initializing MaxEvo Core...')
      
      // Set up event handlers
      this.setupEventHandlers()
      
      // Initialize component registry
      this.initializeComponentRegistry()
      
      // Start task processing
      this.startTaskProcessor()
      
      this.state.initialized = true
      this.emit('core:initialized')
      
      console.log('✅ MaxEvo Core initialized successfully')
      return true
      
    } catch (error) {
      console.error('❌ MaxEvo Core initialization failed:', error)
      this.emit('core:error', error)
      throw error
    }
  }

  /**
   * Register a service component with the core
   */
  registerService(name, service) {
    if (!name || !service) {
      throw new Error('Service name and instance are required')
    }
    
    this.services[name] = service
    this.state.components.set(name, {
      service,
      status: 'registered',
      registeredAt: new Date()
    })
    
    console.log(`📦 Service registered: ${name}`)
    this.emit('service:registered', { name, service })
  }

  /**
   * Get a registered service
   */
  getService(name) {
    return this.services[name]
  }

  /**
   * Submit a task to the MaxEvo system
   */
  async submitTask(task) {
    const taskId = uuidv4()
    const enhancedTask = {
      id: taskId,
      ...task,
      status: 'pending',
      createdAt: new Date(),
      attempts: 0
    }
    
    this.state.taskQueue.push(enhancedTask)
    this.emit('task:submitted', enhancedTask)
    
    console.log(`📝 Task submitted: ${taskId}`)
    return taskId
  }

  /**
   * Process tasks from the queue
   */
  async processTask(task) {
    try {
      this.state.activeTasks.set(task.id, task)
      this.emit('task:started', task)
      
      // Route task based on type
      let result
      switch (task.type) {
        case 'chat':
          result = await this.processChatTask(task)
          break
        case 'analysis':
          result = await this.processAnalysisTask(task)
          break
        case 'automation':
          result = await this.processAutomationTask(task)
          break
        default:
          result = await this.processGenericTask(task)
      }
      
      task.status = 'completed'
      task.result = result
      task.completedAt = new Date()
      
      this.state.activeTasks.delete(task.id)
      this.state.stats.tasksProcessed++
      this.state.stats.tasksSucceeded++
      
      this.emit('task:completed', task)
      console.log(`✅ Task completed: ${task.id}`)
      
      return result
      
    } catch (error) {
      console.error(`❌ Task failed: ${task.id}`, error)
      
      task.status = 'failed'
      task.error = error.message
      task.failedAt = new Date()
      
      this.state.activeTasks.delete(task.id)
      this.state.stats.tasksProcessed++
      this.state.stats.tasksFailed++
      
      this.emit('task:failed', task, error)
      throw error
    }
  }

  /**
   * Process chat-type tasks
   */
  async processChatTask(task) {
    const agentRouter = this.getService('agentRouter')
    if (!agentRouter) {
      throw new Error('Agent Router service not available')
    }
    
    const normalized = normalizeUserInput(task)
    if (!normalized) throw new Error('Empty user input')

    const routed = { ...task, content: normalized, message: normalized }
    console.log('🧭 Core.routeTask → Router', { type: routed.type, contentLen: routed.content.length })
    
    return await agentRouter.routeTask(routed)
  }

  /**
   * Process analysis-type tasks
   */
  async processAnalysisTask(task) {
    // Route to appropriate analysis agent
    const agentRouter = this.getService('agentRouter')
    if (!agentRouter) {
      throw new Error('Agent Router service not available')
    }
    
    return await agentRouter.routeTask({
      ...task,
      preferredAgent: 'claude', // Claude is better for analysis
      requirements: ['reasoning', 'analysis']
    })
  }

  /**
   * Process automation-type tasks
   */
  async processAutomationTask(task) {
    const scheduler = this.getService('scheduler')
    if (!scheduler) {
      throw new Error('Scheduler service not available')
    }
    
    // Handle automation through scheduler
    return await scheduler.scheduleTask(task)
  }

  /**
   * Process generic tasks
   */
  async processGenericTask(task) {
    const agentRouter = this.getService('agentRouter')
    if (agentRouter) {
      const normalized = normalizeUserInput(task)
      if (!normalized) throw new Error('Empty user input')

      const routed = { ...task, content: normalized, message: normalized }
      console.log('🧭 Core.routeTask → Router', { type: routed.type, contentLen: routed.content.length })
      
      return await agentRouter.routeTask(routed)
    }
    
    // Fallback response
    return {
      response: `Task "${task.content}" has been processed by MaxEvo Core.`,
      agent: 'MaxEvo Core',
      taskId: task.id
    }
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      initialized: this.state.initialized,
      components: Object.keys(this.services).reduce((acc, name) => {
        acc[name] = this.services[name] ? 'online' : 'offline'
        return acc
      }, {}),
      activeTasks: this.state.activeTasks.size,
      queuedTasks: this.state.taskQueue.length,
      stats: {
        ...this.state.stats,
        uptime: Date.now() - this.state.stats.uptime
      }
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.on('task:submitted', (task) => {
      console.log(`📬 Task queued: ${task.id} (${task.type})`)
    })
    
    this.on('task:completed', (task) => {
      console.log(`✅ Task success: ${task.id}`)
    })
    
    this.on('task:failed', (task, error) => {
      console.log(`❌ Task failed: ${task.id} - ${error.message}`)
    })
  }

  /**
   * Initialize component registry
   */
  initializeComponentRegistry() {
    this.state.components.clear()
    console.log('📋 Component registry initialized')
  }

  /**
   * Start the task processor
   */
  startTaskProcessor() {
    setInterval(async () => {
      if (this.state.taskQueue.length > 0 && this.state.activeTasks.size < this.config.maxConcurrentTasks) {
        const task = this.state.taskQueue.shift()
        try {
          await this.processTask(task)
        } catch (error) {
          // Error already handled in processTask
        }
      }
    }, 1000) // Check every second
    
    console.log('⚡ Task processor started')
  }

  /**
   * Shutdown the core system
   */
  async shutdown() {
    console.log('🛑 Shutting down MaxEvo Core...')
    
    // Wait for active tasks to complete
    const activeTaskIds = Array.from(this.state.activeTasks.keys())
    if (activeTaskIds.length > 0) {
      console.log(`⏳ Waiting for ${activeTaskIds.length} active tasks to complete...`)
      
      const timeout = setTimeout(() => {
        console.log('⚠️ Shutdown timeout - forcing close')
      }, 30000)
      
      while (this.state.activeTasks.size > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      clearTimeout(timeout)
    }
    
    this.state.initialized = false
    this.emit('core:shutdown')
    console.log('✅ MaxEvo Core shutdown complete')
  }
}

module.exports = MaxEvoCore