const { logger } = require('~/utils');
const { getTaskRunner } = require('./task-runner');
const MaxEvoWebSocket = require('./MaxEvoWebSocket');

/**
 * Initialize MaxEvo AI Operating System
 * Sets up all core components: Memory, Scheduler, Agent Router, WebSocket
 */
async function initializeMaxEvo(app, server) {
  try {
    logger.info('[MaxEvo] Starting AI Operating System initialization...');

    // Initialize Task Runner (includes Memory Core, Scheduler, Agent Router)
    logger.info('[MaxEvo] Initializing Task Runner...');
    const taskRunner = await getTaskRunner().catch(error => {
      logger.warn('[MaxEvo] Task Runner initialization failed, using fallback mode:', error.message);
      return null;
    });
    
    // Store task runner reference globally for API access
    app.locals.maxevoTaskRunner = taskRunner;
    
    if (taskRunner) {
      logger.info('[MaxEvo] Task Runner initialized successfully');
    } else {
      logger.warn('[MaxEvo] Task Runner not available - basic mode only');
    }

    // Initialize WebSocket server for real-time multi-agent communication
    if (server) {
      logger.info('[MaxEvo] Initializing WebSocket server...');
      const maxevoCore = taskRunner.core;
      const webSocketServer = new MaxEvoWebSocket(server, maxevoCore);
      await webSocketServer.initialize();
      
      // Store WebSocket server reference
      app.locals.maxevoWebSocket = webSocketServer;
      
      // Set up cleanup interval for dead connections
      setInterval(() => {
        webSocketServer.cleanup();
      }, 60000); // Clean up every minute

      logger.info('[MaxEvo] WebSocket server initialized successfully');
    } else {
      logger.warn('[MaxEvo] HTTP server not provided - WebSocket functionality disabled');
    }

    // Log system status
    const status = taskRunner.getStatus();
    logger.info('[MaxEvo] System Status:', {
      core: status.core,
      scheduler: status.scheduler,
      router: status.router,
      isRunning: status.isRunning
    });

    // Set up graceful shutdown
    const gracefulShutdown = async () => {
      try {
        logger.info('[MaxEvo] Graceful shutdown initiated...');
        
        if (taskRunner) {
          await taskRunner.shutdown();
        }
        
        if (app.locals.maxevoWebSocket) {
          // WebSocket cleanup is handled automatically
          logger.info('[MaxEvo] WebSocket server shutdown complete');
        }
        
        logger.info('[MaxEvo] Graceful shutdown complete');
      } catch (error) {
        logger.error('[MaxEvo] Error during graceful shutdown:', error);
      }
    };

    // Register shutdown handlers
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Schedule periodic system health checks
    setInterval(async () => {
      try {
        const healthStatus = taskRunner.getStatus();
        if (!healthStatus.isRunning) {
          logger.warn('[MaxEvo] System health check failed - Task Runner not running');
        }
        
        // Log memory usage
        const memoryUsage = process.memoryUsage();
        logger.debug('[MaxEvo] Memory Usage:', {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
        });

      } catch (error) {
        logger.error('[MaxEvo] Health check error:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    logger.info('🚀 [MaxEvo] AI Operating System initialized successfully!');
    logger.info('🤖 [MaxEvo] Multi-agent collaboration system online');
    logger.info('📡 [MaxEvo] WebSocket server ready for real-time communication');
    logger.info('⏰ [MaxEvo] Scheduled task system active');
    logger.info('🧠 [MaxEvo] Memory core and resurrection protocol enabled');
    
    return {
      taskRunner,
      webSocketServer: app.locals.maxevoWebSocket,
      status: 'online'
    };

  } catch (error) {
    logger.error('[MaxEvo] Initialization failed:', error);
    throw error;
  }
}

/**
 * Get MaxEvo system status
 */
function getMaxEvoStatus(app) {
  try {
    const status = {
      initialized: false,
      taskRunner: null,
      webSocket: null,
      components: {
        memoryCore: false,
        scheduler: false,
        agentRouter: false,
        webSocketServer: false,
        terminalSystem: false
      }
    };

    if (app.locals.maxevoTaskRunner) {
      status.initialized = true;
      status.taskRunner = app.locals.maxevoTaskRunner.getStatus();
      status.components.memoryCore = status.taskRunner.core === 'online';
      status.components.scheduler = status.taskRunner.scheduler === 'online';
      status.components.agentRouter = status.taskRunner.router === 'online';
      status.components.terminalSystem = true; // Always available via API
    }

    if (app.locals.maxevoWebSocket) {
      status.webSocket = app.locals.maxevoWebSocket.getStatus();
      status.components.webSocketServer = true;
    }

    return status;

  } catch (error) {
    logger.error('[MaxEvo] Status check failed:', error);
    return { error: error.message };
  }
}

/**
 * Trigger a MaxEvo task programmatically
 */
async function triggerMaxEvoTask(app, taskData) {
  try {
    const taskRunner = app.locals.maxevoTaskRunner;
    if (!taskRunner) {
      throw new Error('MaxEvo not initialized');
    }

    const result = await taskRunner.runTask(taskData);
    logger.info(`[MaxEvo] Task triggered programmatically: ${result.taskId}`);
    
    return result;

  } catch (error) {
    logger.error('[MaxEvo] Programmatic task trigger failed:', error);
    throw error;
  }
}

module.exports = {
  initializeMaxEvo,
  getMaxEvoStatus,
  triggerMaxEvoTask
};