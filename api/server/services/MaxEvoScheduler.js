const cron = require('node-cron');
const { logger } = require('~/utils/logger');
const MaxEvoCore = require('./MaxEvoCore');
const AgentRouter = require('./MaxEvoAgentRouter');

/**
 * MaxEvo Scheduled Wake Trigger System
 * Token-efficient task execution - wake agents only when needed
 */
class MaxEvoScheduler {
  constructor() {
    this.maxevoCore = null;
    this.agentRouter = null;
    this.scheduledTasks = new Map();
    this.isRunning = false;
  }

  /**
   * Initialize the scheduler
   */
  async initialize() {
    try {
      this.maxevoCore = new MaxEvoCore();
      await this.maxevoCore.initialize();
      
      this.agentRouter = new AgentRouter(this.maxevoCore);
      await this.agentRouter.initialize();

      // Start the main scheduler loop (every minute)
      this.startMainLoop();
      
      // Schedule cleanup task (daily at 2 AM)
      this.scheduleCleanup();
      
      this.isRunning = true;
      logger.info('[MaxEvo Scheduler] Initialized successfully');
    } catch (error) {
      logger.error('[MaxEvo Scheduler] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start the main scheduler loop
   * Checks every minute for tasks to execute
   */
  startMainLoop() {
    // Run every minute
    cron.schedule('* * * * *', async () => {
      try {
        await this.checkAndExecuteTasks();
      } catch (error) {
        logger.error('[MaxEvo Scheduler] Main loop error:', error);
      }
    });

    logger.info('[MaxEvo Scheduler] Main loop started (checks every minute)');
  }

  /**
   * Check for scheduled tasks and execute them
   */
  async checkAndExecuteTasks() {
    if (!this.maxevoCore) return;

    try {
      const scheduledTasks = this.maxevoCore.getTasks('scheduled');
      const now = new Date();

      for (const task of scheduledTasks) {
        const runTime = new Date(task.runAt);
        
        // Execute if it's time or past due
        if (runTime <= now) {
          logger.info(`[MaxEvo Scheduler] Executing scheduled task: ${task.id}`);
          
          // Update task status to active
          await this.maxevoCore.updateTask(task.id, { 
            status: 'active',
            startedAt: new Date().toISOString()
          });

          // Route task to appropriate agent
          this.executeTask(task);
        }
      }
    } catch (error) {
      logger.error('[MaxEvo Scheduler] Error checking tasks:', error);
    }
  }

  /**
   * Execute a task using the agent router
   */
  async executeTask(task) {
    try {
      // Create resurrection checkpoint before execution
      await this.maxevoCore.createCheckpoint({
        currentTask: task,
        timestamp: new Date().toISOString(),
        context: 'task_execution'
      });

      // Route to appropriate agent
      const result = await this.agentRouter.routeTask(task);
      
      // Mark task as completed
      await this.maxevoCore.completeTask(task.id, result);
      
      logger.info(`[MaxEvo Scheduler] Task completed: ${task.id}`);
    } catch (error) {
      logger.error(`[MaxEvo Scheduler] Task execution failed: ${task.id}`, error);
      
      // Mark task as failed
      await this.maxevoCore.updateTask(task.id, {
        status: 'failed',
        error: error.message,
        failedAt: new Date().toISOString()
      });
    }
  }

  /**
   * Schedule a new task
   */
  async scheduleTask(taskData) {
    try {
      if (!taskData.runAt) {
        throw new Error('runAt is required for scheduled tasks');
      }

      const task = await this.maxevoCore.addTask({
        ...taskData,
        status: 'scheduled'
      });

      logger.info(`[MaxEvo Scheduler] Task scheduled: ${task.id} for ${taskData.runAt}`);
      return task;
    } catch (error) {
      logger.error('[MaxEvo Scheduler] Failed to schedule task:', error);
      throw error;
    }
  }

  /**
   * Schedule recurring task using cron syntax
   */
  scheduleRecurringTask(cronExpression, taskTemplate, taskName) {
    try {
      const scheduledTask = cron.schedule(cronExpression, async () => {
        try {
          logger.info(`[MaxEvo Scheduler] Executing recurring task: ${taskName}`);
          
          // Create task from template
          const task = {
            ...taskTemplate,
            id: `recurring_${taskName}_${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'active',
            recurring: true
          };

          // Execute immediately (it's already time)
          await this.executeTask(task);
        } catch (error) {
          logger.error(`[MaxEvo Scheduler] Recurring task failed: ${taskName}`, error);
        }
      });

      this.scheduledTasks.set(taskName, scheduledTask);
      logger.info(`[MaxEvo Scheduler] Recurring task scheduled: ${taskName} (${cronExpression})`);
      
      return taskName;
    } catch (error) {
      logger.error('[MaxEvo Scheduler] Failed to schedule recurring task:', error);
      throw error;
    }
  }

  /**
   * Cancel a recurring task
   */
  cancelRecurringTask(taskName) {
    try {
      const task = this.scheduledTasks.get(taskName);
      if (task) {
        task.stop();
        this.scheduledTasks.delete(taskName);
        logger.info(`[MaxEvo Scheduler] Recurring task cancelled: ${taskName}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[MaxEvo Scheduler] Failed to cancel recurring task:', error);
      throw error;
    }
  }

  /**
   * Schedule daily cleanup task
   */
  scheduleCleanup() {
    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('[MaxEvo Scheduler] Running daily cleanup');
        await this.maxevoCore.cleanup();
        logger.info('[MaxEvo Scheduler] Daily cleanup completed');
      } catch (error) {
        logger.error('[MaxEvo Scheduler] Cleanup failed:', error);
      }
    });

    logger.info('[MaxEvo Scheduler] Daily cleanup scheduled for 2 AM');
  }

  /**
   * Common scheduled task templates
   */
  getTaskTemplates() {
    return {
      optimizeBlog: {
        task: 'optimize_new_blog',
        agent: 'claude',
        payload: { 
          action: 'analyze_and_optimize',
          target: 'recent_posts'
        },
        priority: 'high'
      },
      
      systemHealthCheck: {
        task: 'system_health_check',
        agent: 'claude',
        payload: {
          action: 'check_system_status',
          components: ['database', 'apis', 'memory']
        },
        priority: 'medium'
      },

      dataBackup: {
        task: 'backup_system_data',
        agent: 'claude',
        payload: {
          action: 'backup',
          target: ['maxevo_state.json', 'taskQueue.json']
        },
        priority: 'high'
      },

      contentAnalysis: {
        task: 'analyze_content_performance',
        agent: 'gpt',
        payload: {
          action: 'analyze',
          timeframe: '24h'
        },
        priority: 'low'
      }
    };
  }

  /**
   * Quick schedule methods for common patterns
   */
  scheduleDaily(time, taskTemplate, taskName) {
    const [hour, minute] = time.split(':');
    return this.scheduleRecurringTask(
      `${minute} ${hour} * * *`,
      taskTemplate,
      taskName
    );
  }

  scheduleWeekly(dayOfWeek, time, taskTemplate, taskName) {
    const [hour, minute] = time.split(':');
    return this.scheduleRecurringTask(
      `${minute} ${hour} * * ${dayOfWeek}`,
      taskTemplate,
      taskName
    );
  }

  scheduleHourly(taskTemplate, taskName) {
    return this.scheduleRecurringTask(
      '0 * * * *',
      taskTemplate,
      taskName
    );
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      scheduledTasks: Array.from(this.scheduledTasks.keys()),
      uptime: this.isRunning ? Date.now() - this.startTime : 0,
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * Stop the scheduler
   */
  async stop() {
    try {
      // Stop all recurring tasks
      for (const [name, task] of this.scheduledTasks) {
        task.stop();
        logger.info(`[MaxEvo Scheduler] Stopped recurring task: ${name}`);
      }
      
      this.scheduledTasks.clear();
      this.isRunning = false;
      
      logger.info('[MaxEvo Scheduler] Stopped successfully');
    } catch (error) {
      logger.error('[MaxEvo Scheduler] Error stopping scheduler:', error);
      throw error;
    }
  }
}

module.exports = MaxEvoScheduler;