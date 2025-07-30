const { logger } = require('~/utils');
const MaxEvoCore = require('./MaxEvoCore');
const MaxEvoScheduler = require('./MaxEvoScheduler');
const MaxEvoAgentRouter = require('./MaxEvoAgentRouter');

/**
 * MaxEvo Task Runner
 * Main orchestrator that loads memory and executes triggered tasks
 * Token-efficient: wake → load context → execute → sleep
 */
class MaxEvoTaskRunner {
  constructor() {
    this.core = null;
    this.scheduler = null;
    this.router = null;
    this.isRunning = false;
    this.currentExecution = null;
  }

  /**
   * Initialize the task runner
   */
  async initialize() {
    try {
      logger.info('[MaxEvo Task Runner] Initializing...');

      // Initialize core components
      this.core = new MaxEvoCore();
      await this.core.initialize();

      this.router = new MaxEvoAgentRouter(this.core);
      await this.router.initialize();

      this.scheduler = new MaxEvoScheduler();
      await this.scheduler.initialize();

      // Setup default recurring tasks
      await this.setupDefaultTasks();

      this.isRunning = true;
      logger.info('[MaxEvo Task Runner] Initialization complete - System online');

      // Update system status
      await this.core.updateState({
        systemInfo: {
          ...this.core.getState().systemInfo,
          lastRestart: new Date().toISOString(),
          status: 'online'
        }
      });

    } catch (error) {
      logger.error('[MaxEvo Task Runner] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup default recurring tasks
   */
  async setupDefaultTasks() {
    try {
      const templates = this.scheduler.getTaskTemplates();

      // Daily blog optimization at 10 AM
      this.scheduler.scheduleDaily('10:00', templates.optimizeBlog, 'daily_blog_optimization');

      // System health check every 6 hours
      this.scheduler.scheduleRecurringTask('0 */6 * * *', templates.systemHealthCheck, 'system_health_check');

      // Daily backup at 3 AM
      this.scheduler.scheduleDaily('03:00', templates.dataBackup, 'daily_backup');

      // Weekly content analysis on Mondays at 9 AM
      this.scheduler.scheduleWeekly(1, '09:00', templates.contentAnalysis, 'weekly_content_analysis');

      logger.info('[MaxEvo Task Runner] Default recurring tasks scheduled');
    } catch (error) {
      logger.error('[MaxEvo Task Runner] Failed to setup default tasks:', error);
    }
  }

  /**
   * Execute a single task with full context loading
   * This is the core "wake → execute → sleep" pattern
   */
  async executeTask(taskId) {
    let task = null;
    
    try {
      // WAKE: Load task and memory context
      logger.info(`[MaxEvo Task Runner] Waking up for task: ${taskId}`);
      
      task = this.core.getTasks().find(t => t.id === taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      this.currentExecution = {
        taskId,
        startTime: Date.now(),
        agent: task.agent || 'claude'
      };

      // Load relevant memory context
      const context = await this.loadTaskContext(task);
      
      // Create resurrection checkpoint
      await this.core.createCheckpoint({
        currentTask: task,
        context,
        executionState: 'starting',
        timestamp: new Date().toISOString()
      });

      // EXECUTE: Route to appropriate agent with full context
      logger.info(`[MaxEvo Task Runner] Executing task: ${taskId}`);
      
      const enrichedTask = {
        ...task,
        context,
        memoryState: this.core.getState().memory
      };

      const result = await this.router.routeTask(enrichedTask);

      // Store execution result in memory
      await this.storeExecutionResult(task, result);

      // Mark task as completed
      await this.core.completeTask(taskId, result);

      // SLEEP: Clean up and prepare for next wake
      this.currentExecution = null;
      
      logger.info(`[MaxEvo Task Runner] Task completed and sleeping: ${taskId}`);
      
      return result;

    } catch (error) {
      logger.error(`[MaxEvo Task Runner] Task execution failed: ${taskId}`, error);
      
      // Update task status to failed
      if (task) {
        await this.core.updateTask(taskId, {
          status: 'failed',
          error: error.message,
          failedAt: new Date().toISOString()
        });
      }

      // Create failure checkpoint for resurrection
      await this.core.createCheckpoint({
        currentTask: task,
        error: error.message,
        executionState: 'failed',
        timestamp: new Date().toISOString()
      });

      this.currentExecution = null;
      throw error;
    }
  }

  /**
   * Load relevant context for task execution
   */
  async loadTaskContext(task) {
    try {
      const state = this.core.getState();
      const context = {
        systemInfo: state.systemInfo,
        agentHistory: state.agents[task.agent] || {},
        relatedConversations: [],
        previousExecutions: []
      };

      // Load related conversations based on task type
      if (state.memory.conversations) {
        context.relatedConversations = Object.values(state.memory.conversations)
          .filter(conv => this.isConversationRelevant(conv, task))
          .slice(-5); // Last 5 relevant conversations
      }

      // Load previous similar task executions
      const completedTasks = this.core.taskQueue?.completed || [];
      context.previousExecutions = completedTasks
        .filter(t => t.task === task.task)
        .slice(-3) // Last 3 similar executions
        .map(t => ({
          id: t.id,
          result: t.result,
          completedAt: t.completedAt,
          executionTime: t.result?.metadata?.executionTime
        }));

      logger.debug(`[MaxEvo Task Runner] Loaded context for task ${task.id}:`, {
        conversations: context.relatedConversations.length,
        previousExecutions: context.previousExecutions.length
      });

      return context;

    } catch (error) {
      logger.error(`[MaxEvo Task Runner] Failed to load context for task ${task.id}:`, error);
      return { error: error.message };
    }
  }

  /**
   * Check if a conversation is relevant to the task
   */
  isConversationRelevant(conversation, task) {
    const taskKeywords = [
      task.task,
      task.agent,
      ...(task.payload ? Object.values(task.payload).flat() : [])
    ].filter(Boolean).map(k => k.toString().toLowerCase());

    const conversationText = JSON.stringify(conversation).toLowerCase();
    
    return taskKeywords.some(keyword => conversationText.includes(keyword));
  }

  /**
   * Store execution result in system memory
   */
  async storeExecutionResult(task, result) {
    try {
      const state = this.core.getState();
      
      // Update memory with execution learnings
      if (!state.memory.learnings[task.task]) {
        state.memory.learnings[task.task] = [];
      }

      const learning = {
        taskId: task.id,
        executedAt: new Date().toISOString(),
        agent: task.agent,
        success: result.success,
        executionTime: result.metadata?.executionTime,
        tokensUsed: result.metadata?.tokensUsed,
        insight: this.extractInsight(task, result)
      };

      state.memory.learnings[task.task].push(learning);

      // Keep only last 10 learnings per task type
      if (state.memory.learnings[task.task].length > 10) {
        state.memory.learnings[task.task] = state.memory.learnings[task.task].slice(-10);
      }

      await this.core.updateState({ memory: state.memory });
      
      logger.debug(`[MaxEvo Task Runner] Stored execution result for task ${task.id}`);

    } catch (error) {
      logger.error(`[MaxEvo Task Runner] Failed to store execution result:`, error);
    }
  }

  /**
   * Extract insights from task execution
   */
  extractInsight(task, result) {
    const insights = [];

    // Performance insights
    if (result.metadata?.executionTime) {
      const executionTime = result.metadata.executionTime;
      if (executionTime > 10000) {
        insights.push('Long execution time - consider optimization');
      } else if (executionTime < 1000) {
        insights.push('Fast execution - good performance');
      }
    }

    // Token usage insights
    if (result.metadata?.tokensUsed) {
      const tokensUsed = result.metadata.tokensUsed;
      if (tokensUsed > 50000) {
        insights.push('High token usage - consider task simplification');
      }
    }

    // Success pattern insights
    if (result.success) {
      insights.push(`Successful execution with ${task.agent}`);
    } else {
      insights.push(`Failed execution - may need different agent or approach`);
    }

    return insights.join('; ');
  }

  /**
   * Manual task execution (for immediate tasks)
   */
  async runTask(taskData) {
    try {
      // Add task to queue
      const task = await this.core.addTask({
        ...taskData,
        status: 'active',
        triggeredBy: 'manual',
        triggeredAt: new Date().toISOString()
      });

      // Execute immediately
      const result = await this.executeTask(task.id);
      
      return {
        success: true,
        taskId: task.id,
        result
      };

    } catch (error) {
      logger.error('[MaxEvo Task Runner] Manual task execution failed:', error);
      throw error;
    }
  }

  /**
   * Resurrection protocol - recover from system restart
   */
  async resurrect() {
    try {
      logger.info('[MaxEvo Task Runner] Starting resurrection protocol...');

      const resurrectionData = this.core.getResurrectionData();
      
      if (!resurrectionData || !resurrectionData.currentTask) {
        logger.info('[MaxEvo Task Runner] No recovery data found - clean start');
        return;
      }

      const { currentTask, executionState, timestamp } = resurrectionData;
      const timeSinceCheckpoint = Date.now() - new Date(timestamp).getTime();

      logger.info(`[MaxEvo Task Runner] Found recovery data for task ${currentTask.id} (${executionState}, ${timeSinceCheckpoint}ms ago)`);

      // If the task was in progress and checkpoint is recent (< 5 minutes)
      if (executionState === 'starting' && timeSinceCheckpoint < 300000) {
        logger.info('[MaxEvo Task Runner] Attempting to resume interrupted task...');
        
        try {
          // Update task status back to active
          await this.core.updateTask(currentTask.id, {
            status: 'active',
            resumedAt: new Date().toISOString()
          });

          // Re-execute the task
          await this.executeTask(currentTask.id);
          
          logger.info('[MaxEvo Task Runner] Successfully resumed interrupted task');
        } catch (error) {
          logger.error('[MaxEvo Task Runner] Failed to resume task, marking as failed:', error);
          
          await this.core.updateTask(currentTask.id, {
            status: 'failed',
            error: `Resurrection failed: ${error.message}`,
            failedAt: new Date().toISOString()
          });
        }
      } else {
        logger.info('[MaxEvo Task Runner] Recovery data too old or task was not in progress - skipping resurrection');
      }

      // Clear resurrection data
      await this.core.createCheckpoint({});

    } catch (error) {
      logger.error('[MaxEvo Task Runner] Resurrection protocol failed:', error);
    }
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentExecution: this.currentExecution,
      core: this.core ? 'online' : 'offline',
      scheduler: this.scheduler ? 'online' : 'offline',
      router: this.router ? 'online' : 'offline',
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }

  /**
   * Shutdown gracefully
   */
  async shutdown() {
    try {
      logger.info('[MaxEvo Task Runner] Shutting down...');

      // Stop scheduler
      if (this.scheduler) {
        await this.scheduler.stop();
      }

      // Create final checkpoint
      if (this.core && this.currentExecution) {
        await this.core.createCheckpoint({
          currentTask: this.currentExecution,
          executionState: 'interrupted',
          timestamp: new Date().toISOString()
        });
      }

      this.isRunning = false;
      logger.info('[MaxEvo Task Runner] Shutdown complete');

    } catch (error) {
      logger.error('[MaxEvo Task Runner] Shutdown error:', error);
    }
  }
}

// Export singleton instance
let taskRunnerInstance = null;

const getTaskRunner = async () => {
  if (!taskRunnerInstance) {
    taskRunnerInstance = new MaxEvoTaskRunner();
    await taskRunnerInstance.initialize();
    
    // Start resurrection protocol
    await taskRunnerInstance.resurrect();
  }
  return taskRunnerInstance;
};

module.exports = {
  MaxEvoTaskRunner,
  getTaskRunner
};