const fs = require('fs').promises;
const path = require('path');
const { logger } = require('~/utils');

/**
 * MaxEvo Memory Core - Persistent state management system
 * Stores system state in maxevo_state.json with resurrection protocol support
 */
class MaxEvoCore {
  constructor() {
    this.stateFile = path.join(process.cwd(), 'maxevo_state.json');
    this.taskQueueFile = path.join(process.cwd(), 'taskQueue.json');
    this.state = null;
    this.taskQueue = null;
  }

  /**
   * Initialize MaxEvo Core - Load existing state or create new
   */
  async initialize() {
    try {
      await this.loadState();
      await this.loadTaskQueue();
      logger.info('[MaxEvo Core] Initialized successfully');
    } catch (error) {
      logger.error('[MaxEvo Core] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load system state from maxevo_state.json
   */
  async loadState() {
    try {
      const data = await fs.readFile(this.stateFile, 'utf8');
      this.state = JSON.parse(data);
      logger.debug('[MaxEvo Core] State loaded from file');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create default state if file doesn't exist
        this.state = this.createDefaultState();
        await this.saveState();
        logger.info('[MaxEvo Core] Created new state file');
      } else {
        logger.error('[MaxEvo Core] Failed to load state:', error);
        throw error;
      }
    }
  }

  /**
   * Load task queue from taskQueue.json
   */
  async loadTaskQueue() {
    try {
      const data = await fs.readFile(this.taskQueueFile, 'utf8');
      this.taskQueue = JSON.parse(data);
      logger.debug('[MaxEvo Core] Task queue loaded from file');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create default task queue if file doesn't exist
        this.taskQueue = this.createDefaultTaskQueue();
        await this.saveTaskQueue();
        logger.info('[MaxEvo Core] Created new task queue file');
      } else {
        logger.error('[MaxEvo Core] Failed to load task queue:', error);
        throw error;
      }
    }
  }

  /**
   * Create default system state
   */
  createDefaultState() {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      systemInfo: {
        uptime: 0,
        tasksCompleted: 0,
        lastRestart: new Date().toISOString(),
        activeAgents: []
      },
      memory: {
        conversations: {},
        contexts: {},
        learnings: {}
      },
      agents: {
        claude: {
          status: 'idle',
          lastActive: null,
          currentTask: null,
          completedTasks: 0
        },
        gpt: {
          status: 'idle', 
          lastActive: null,
          currentTask: null,
          completedTasks: 0
        }
      },
      resurrection: {
        enabled: true,
        lastCheckpoint: new Date().toISOString(),
        recoveryData: {}
      }
    };
  }

  /**
   * Create default task queue
   */
  createDefaultTaskQueue() {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      tasks: [],
      completed: [],
      failed: []
    };
  }

  /**
   * Save current state to file
   */
  async saveState() {
    try {
      this.state.lastUpdated = new Date().toISOString();
      await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
      logger.debug('[MaxEvo Core] State saved to file');
    } catch (error) {
      logger.error('[MaxEvo Core] Failed to save state:', error);
      throw error;
    }
  }

  /**
   * Save current task queue to file
   */
  async saveTaskQueue() {
    try {
      this.taskQueue.lastUpdated = new Date().toISOString();
      await fs.writeFile(this.taskQueueFile, JSON.stringify(this.taskQueue, null, 2));
      logger.debug('[MaxEvo Core] Task queue saved to file');
    } catch (error) {
      logger.error('[MaxEvo Core] Failed to save task queue:', error);
      throw error;
    }
  }

  /**
   * Get current system state
   */
  getState() {
    return this.state;
  }

  /**
   * Update system state
   */
  async updateState(updates) {
    try {
      this.state = { ...this.state, ...updates };
      await this.saveState();
      logger.debug('[MaxEvo Core] State updated');
    } catch (error) {
      logger.error('[MaxEvo Core] Failed to update state:', error);
      throw error;
    }
  }

  /**
   * Add task to queue
   */
  async addTask(task) {
    try {
      const taskWithId = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        status: 'pending',
        ...task
      };
      
      this.taskQueue.tasks.push(taskWithId);
      await this.saveTaskQueue();
      
      logger.info(`[MaxEvo Core] Task added: ${taskWithId.id}`);
      return taskWithId;
    } catch (error) {
      logger.error('[MaxEvo Core] Failed to add task:', error);
      throw error;
    }
  }

  /**
   * Get tasks by status
   */
  getTasks(status = null) {
    if (!status) {
      return this.taskQueue.tasks;
    }
    return this.taskQueue.tasks.filter(task => task.status === status);
  }

  /**
   * Update task status
   */
  async updateTask(taskId, updates) {
    try {
      const taskIndex = this.taskQueue.tasks.findIndex(task => task.id === taskId);
      if (taskIndex === -1) {
        throw new Error(`Task not found: ${taskId}`);
      }

      this.taskQueue.tasks[taskIndex] = {
        ...this.taskQueue.tasks[taskIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await this.saveTaskQueue();
      logger.debug(`[MaxEvo Core] Task updated: ${taskId}`);
    } catch (error) {
      logger.error('[MaxEvo Core] Failed to update task:', error);
      throw error;
    }
  }

  /**
   * Move task to completed
   */
  async completeTask(taskId, result = null) {
    try {
      const taskIndex = this.taskQueue.tasks.findIndex(task => task.id === taskId);
      if (taskIndex === -1) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const task = this.taskQueue.tasks[taskIndex];
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.result = result;

      // Move to completed array
      this.taskQueue.completed.push(task);
      this.taskQueue.tasks.splice(taskIndex, 1);

      await this.saveTaskQueue();
      logger.info(`[MaxEvo Core] Task completed: ${taskId}`);
    } catch (error) {
      logger.error('[MaxEvo Core] Failed to complete task:', error);
      throw error;
    }
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(agentName, status, currentTask = null) {
    try {
      if (!this.state.agents[agentName]) {
        this.state.agents[agentName] = {
          status: 'idle',
          lastActive: null,
          currentTask: null,
          completedTasks: 0
        };
      }

      this.state.agents[agentName].status = status;
      this.state.agents[agentName].lastActive = new Date().toISOString();
      this.state.agents[agentName].currentTask = currentTask;

      await this.saveState();
      logger.debug(`[MaxEvo Core] Agent ${agentName} status: ${status}`);
    } catch (error) {
      logger.error('[MaxEvo Core] Failed to update agent status:', error);
      throw error;
    }
  }

  /**
   * Create resurrection checkpoint
   */
  async createCheckpoint(data) {
    try {
      this.state.resurrection.lastCheckpoint = new Date().toISOString();
      this.state.resurrection.recoveryData = data;
      await this.saveState();
      logger.debug('[MaxEvo Core] Resurrection checkpoint created');
    } catch (error) {
      logger.error('[MaxEvo Core] Failed to create checkpoint:', error);
      throw error;
    }
  }

  /**
   * Get resurrection data for recovery
   */
  getResurrectionData() {
    return this.state.resurrection.recoveryData;
  }

  /**
   * Clean up old completed tasks and checkpoints
   */
  async cleanup(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    try {
      const cutoff = new Date(Date.now() - maxAge);
      
      // Clean old completed tasks
      this.taskQueue.completed = this.taskQueue.completed.filter(
        task => new Date(task.completedAt) > cutoff
      );
      
      // Clean old failed tasks
      this.taskQueue.failed = this.taskQueue.failed.filter(
        task => new Date(task.failedAt || task.createdAt) > cutoff
      );

      await this.saveTaskQueue();
      logger.info('[MaxEvo Core] Cleanup completed');
    } catch (error) {
      logger.error('[MaxEvo Core] Cleanup failed:', error);
      throw error;
    }
  }
}

module.exports = MaxEvoCore;