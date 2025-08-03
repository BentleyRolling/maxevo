const cron = require('node-cron')
const { v4: uuidv4 } = require('uuid')

/**
 * MaxEvoScheduler - Task scheduling and automation system
 * Handles recurring tasks, delayed execution, and workflow automation
 */
class MaxEvoScheduler {
  constructor(core, config = {}) {
    this.core = core
    this.config = {
      maxConcurrentScheduledTasks: 5,
      defaultRetryDelay: 60000, // 1 minute
      maxRetries: 3,
      ...config
    }
    
    this.scheduledTasks = new Map()
    this.cronJobs = new Map()
    this.recurringTasks = new Map()
    this.stats = {
      tasksScheduled: 0,
      tasksExecuted: 0,
      tasksFailed: 0,
      activeSchedules: 0
    }
    
    this.initialized = false
  }

  /**
   * Initialize the scheduler
   */
  async initialize() {
    try {
      console.log('⏰ Initializing MaxEvo Scheduler...')
      
      // Setup default maintenance tasks
      await this.setupMaintenanceTasks()
      
      // Register with core
      if (this.core) {
        this.core.registerService('scheduler', this)
      }
      
      this.initialized = true
      console.log('✅ MaxEvo Scheduler initialized')
      
    } catch (error) {
      console.error('❌ Scheduler initialization failed:', error)
      throw error
    }
  }

  /**
   * Schedule a one-time task
   */
  async scheduleTask(task, executeAt = null) {
    const taskId = uuidv4()
    const scheduledTask = {
      id: taskId,
      ...task,
      scheduledAt: new Date(),
      executeAt: executeAt || new Date(),
      status: 'scheduled',
      attempts: 0
    }
    
    this.scheduledTasks.set(taskId, scheduledTask)
    this.stats.tasksScheduled++
    this.stats.activeSchedules++
    
    // Schedule execution
    const delay = Math.max(0, scheduledTask.executeAt.getTime() - Date.now())
    
    setTimeout(async () => {
      await this.executeScheduledTask(taskId)
    }, delay)
    
    console.log(`📅 Task scheduled: ${taskId} for ${scheduledTask.executeAt.toISOString()}`)
    return taskId
  }

  /**
   * Schedule a recurring task with cron expression
   */
  scheduleRecurringTask(task, cronExpression, options = {}) {
    const taskId = uuidv4()
    const recurringTask = {
      id: taskId,
      ...task,
      cronExpression,
      options,
      createdAt: new Date(),
      executionCount: 0,
      lastExecution: null,
      nextExecution: null
    }
    
    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`)
    }
    
    // Create cron job
    const cronJob = cron.schedule(cronExpression, async () => {
      await this.executeRecurringTask(taskId)
    }, {
      scheduled: false, // Don't start immediately
      timezone: options.timezone || 'UTC'
    })
    
    this.recurringTasks.set(taskId, recurringTask)
    this.cronJobs.set(taskId, cronJob)
    
    // Start the job
    cronJob.start()
    
    console.log(`🔄 Recurring task scheduled: ${taskId} (${cronExpression})`)
    return taskId
  }

  /**
   * Execute a scheduled task
   */
  async executeScheduledTask(taskId) {
    const task = this.scheduledTasks.get(taskId)
    if (!task) {
      console.warn(`⚠️ Scheduled task not found: ${taskId}`)
      return
    }
    
    try {
      console.log(`⏰ Executing scheduled task: ${taskId}`)
      
      task.status = 'executing'
      task.attempts++
      task.lastAttempt = new Date()
      
      // Execute through core if available
      let result
      if (this.core) {
        result = await this.core.submitTask(task)
      } else {
        result = await this.executeTaskDirect(task)
      }
      
      task.status = 'completed'
      task.result = result
      task.completedAt = new Date()
      
      this.stats.tasksExecuted++
      this.stats.activeSchedules--
      
      console.log(`✅ Scheduled task completed: ${taskId}`)
      
    } catch (error) {
      console.error(`❌ Scheduled task failed: ${taskId}`, error)
      
      task.status = 'failed'
      task.error = error.message
      task.failedAt = new Date()
      
      this.stats.tasksFailed++
      
      // Retry logic
      if (task.attempts < this.config.maxRetries) {
        const retryDelay = this.config.defaultRetryDelay * task.attempts
        console.log(`🔄 Retrying task ${taskId} in ${retryDelay}ms`)
        
        setTimeout(async () => {
          await this.executeScheduledTask(taskId)
        }, retryDelay)
      } else {
        this.stats.activeSchedules--
        console.log(`💀 Task ${taskId} failed permanently after ${task.attempts} attempts`)
      }
    }
  }

  /**
   * Execute a recurring task
   */
  async executeRecurringTask(taskId) {
    const task = this.recurringTasks.get(taskId)
    if (!task) {
      console.warn(`⚠️ Recurring task not found: ${taskId}`)
      return
    }
    
    try {
      console.log(`🔄 Executing recurring task: ${taskId}`)
      
      task.executionCount++
      task.lastExecution = new Date()
      
      // Execute through core if available
      let result
      if (this.core) {
        result = await this.core.submitTask({
          ...task,
          id: `${taskId}-${task.executionCount}`,
          type: task.type || 'recurring'
        })
      } else {
        result = await this.executeTaskDirect(task)
      }
      
      console.log(`✅ Recurring task execution completed: ${taskId}`)
      
    } catch (error) {
      console.error(`❌ Recurring task execution failed: ${taskId}`, error)
      this.stats.tasksFailed++
    }
  }

  /**
   * Execute task directly (fallback when core is not available)
   */
  async executeTaskDirect(task) {
    // Basic task execution logic
    switch (task.type) {
      case 'maintenance':
        return await this.executeMaintenance(task)
      case 'cleanup':
        return await this.executeCleanup(task)
      case 'health_check':
        return await this.executeHealthCheck(task)
      default:
        return { status: 'executed', message: `Task ${task.id} executed directly` }
    }
  }

  /**
   * Execute maintenance tasks
   */
  async executeMaintenance(task) {
    console.log('🧹 Running maintenance task')
    
    // Cleanup old scheduled tasks
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    
    for (const [taskId, scheduledTask] of this.scheduledTasks.entries()) {
      if (scheduledTask.status === 'completed' && 
          scheduledTask.completedAt && 
          scheduledTask.completedAt.getTime() < oneHourAgo) {
        this.scheduledTasks.delete(taskId)
      }
    }
    
    return { status: 'maintenance_completed', tasksRemaining: this.scheduledTasks.size }
  }

  /**
   * Execute cleanup tasks
   */
  async executeCleanup(task) {
    console.log('🗑️ Running cleanup task')
    
    // Clear old logs, temporary files, etc.
    return { status: 'cleanup_completed' }
  }

  /**
   * Execute health check tasks
   */
  async executeHealthCheck(task) {
    console.log('🏥 Running health check')
    
    const status = this.core ? this.core.getStatus() : { status: 'scheduler_only' }
    
    return { status: 'health_check_completed', systemStatus: status }
  }

  /**
   * Setup default maintenance tasks
   */
  async setupMaintenanceTasks() {
    // Daily maintenance at 2 AM
    this.scheduleRecurringTask({
      type: 'maintenance',
      name: 'Daily Maintenance',
      description: 'Clean up old tasks and optimize system'
    }, '0 2 * * *')
    
    // Hourly health check
    this.scheduleRecurringTask({
      type: 'health_check',
      name: 'Health Check',
      description: 'Monitor system health'
    }, '0 * * * *')
    
    console.log('🔧 Default maintenance tasks configured')
  }

  /**
   * Cancel a scheduled task
   */
  cancelTask(taskId) {
    if (this.scheduledTasks.has(taskId)) {
      this.scheduledTasks.delete(taskId)
      this.stats.activeSchedules--
      console.log(`❌ Scheduled task cancelled: ${taskId}`)
      return true
    }
    return false
  }

  /**
   * Cancel a recurring task
   */
  cancelRecurringTask(taskId) {
    if (this.recurringTasks.has(taskId) && this.cronJobs.has(taskId)) {
      const cronJob = this.cronJobs.get(taskId)
      cronJob.stop()
      cronJob.destroy()
      
      this.recurringTasks.delete(taskId)
      this.cronJobs.delete(taskId)
      
      console.log(`❌ Recurring task cancelled: ${taskId}`)
      return true
    }
    return false
  }

  /**
   * Get all scheduled tasks
   */
  getScheduledTasks() {
    return Array.from(this.scheduledTasks.values())
  }

  /**
   * Get all recurring tasks
   */
  getRecurringTasks() {
    return Array.from(this.recurringTasks.values())
  }

  /**
   * Get scheduler statistics
   */
  getStats() {
    return {
      ...this.stats,
      scheduledTasks: this.scheduledTasks.size,
      recurringTasks: this.recurringTasks.size,
      activeJobs: this.cronJobs.size
    }
  }

  /**
   * Health check
   */
  isHealthy() {
    return this.initialized
  }

  /**
   * Shutdown scheduler
   */
  async shutdown() {
    console.log('🛑 Shutting down scheduler...')
    
    // Stop all cron jobs
    for (const [taskId, cronJob] of this.cronJobs.entries()) {
      cronJob.stop()
      cronJob.destroy()
    }
    
    this.cronJobs.clear()
    this.recurringTasks.clear()
    this.scheduledTasks.clear()
    
    console.log('✅ Scheduler shutdown complete')
  }
}

module.exports = MaxEvoScheduler