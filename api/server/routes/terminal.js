const { Router } = require('express');
const { logger } = require('~/utils');
const { requireJwtAuth } = require('~/server/middleware');
const MaxEvoTerminal = require('~/server/services/MaxEvoTerminal');
const MaxEvoCore = require('~/server/services/MaxEvoCore');

const router = Router();

// Store active terminal sessions
const terminalSessions = new Map();

// Initialize MaxEvo Core for terminal operations
let maxevoCore;
(async () => {
  try {
    maxevoCore = new MaxEvoCore();
    await maxevoCore.initialize();
  } catch (error) {
    logger.error('[Terminal Routes] Failed to initialize MaxEvo Core:', error);
  }
})();

/**
 * Create new terminal session
 * POST /terminal/session
 */
router.post('/session', requireJwtAuth, async (req, res) => {
  try {
    const { workingDirectory, secureMode } = req.body;
    const sessionId = `term_${req.user.id}_${Date.now()}`;

    const terminal = new MaxEvoTerminal(maxevoCore);
    await terminal.initialize(sessionId, {
      workingDirectory,
      secureMode
    });

    terminalSessions.set(sessionId, terminal);

    logger.info(`[Terminal] Session created: ${sessionId} for user ${req.user.id}`);

    res.json({
      success: true,
      sessionId,
      workingDirectory: terminal.workingDirectory,
      secureMode: terminal.isSecureMode
    });

  } catch (error) {
    logger.error('[Terminal] Failed to create session:', error);
    res.status(500).json({ error: 'Failed to create terminal session' });
  }
});

/**
 * Execute command in terminal session
 * POST /terminal/:sessionId/execute
 */
router.post('/:sessionId/execute', requireJwtAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { command, timeout, env } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const terminal = terminalSessions.get(sessionId);
    if (!terminal) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }

    const result = await terminal.executeCommand(command, {
      timeout,
      env
    });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error(`[Terminal] Command execution failed:`, error);
    res.status(500).json({ 
      error: error.message || 'Command execution failed',
      success: false
    });
  }
});

/**
 * Read file in terminal session
 * GET /terminal/:sessionId/file
 */
router.get('/:sessionId/file', requireJwtAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { path: filePath, encoding } = req.query;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const terminal = terminalSessions.get(sessionId);
    if (!terminal) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }

    const result = await terminal.readFile(filePath, { encoding });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error(`[Terminal] File read failed:`, error);
    res.status(500).json({ 
      error: error.message || 'File read failed',
      success: false
    });
  }
});

/**
 * Write file in terminal session
 * POST /terminal/:sessionId/file
 */
router.post('/:sessionId/file', requireJwtAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { path: filePath, content, encoding } = req.body;

    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'File path and content are required' });
    }

    const terminal = terminalSessions.get(sessionId);
    if (!terminal) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }

    const result = await terminal.writeFile(filePath, content, { encoding });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error(`[Terminal] File write failed:`, error);
    res.status(500).json({ 
      error: error.message || 'File write failed',
      success: false
    });
  }
});

/**
 * List directory contents
 * GET /terminal/:sessionId/directory
 */
router.get('/:sessionId/directory', requireJwtAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { path: dirPath } = req.query;

    const terminal = terminalSessions.get(sessionId);
    if (!terminal) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }

    const result = await terminal.listDirectory(dirPath);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error(`[Terminal] Directory listing failed:`, error);
    res.status(500).json({ 
      error: error.message || 'Directory listing failed',
      success: false
    });
  }
});

/**
 * Change working directory
 * POST /terminal/:sessionId/cd
 */
router.post('/:sessionId/cd', requireJwtAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { path: newPath } = req.body;

    if (!newPath) {
      return res.status(400).json({ error: 'Path is required' });
    }

    const terminal = terminalSessions.get(sessionId);
    if (!terminal) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }

    const result = await terminal.changeDirectory(newPath);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error(`[Terminal] Directory change failed:`, error);
    res.status(500).json({ 
      error: error.message || 'Directory change failed',
      success: false
    });
  }
});

/**
 * Get terminal session status
 * GET /terminal/:sessionId/status
 */
router.get('/:sessionId/status', requireJwtAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const terminal = terminalSessions.get(sessionId);
    if (!terminal) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }

    const status = terminal.getStatus();

    res.json({
      success: true,
      status
    });

  } catch (error) {
    logger.error(`[Terminal] Status check failed:`, error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

/**
 * Get command history
 * GET /terminal/:sessionId/history
 */
router.get('/:sessionId/history', requireJwtAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit } = req.query;

    const terminal = terminalSessions.get(sessionId);
    if (!terminal) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }

    const history = terminal.getCommandHistory(limit ? parseInt(limit) : undefined);

    res.json({
      success: true,
      history,
      sessionId
    });

  } catch (error) {
    logger.error(`[Terminal] History fetch failed:`, error);
    res.status(500).json({ error: 'History fetch failed' });
  }
});

/**
 * Kill active process
 * POST /terminal/:sessionId/kill/:processId
 */
router.post('/:sessionId/kill/:processId', requireJwtAuth, async (req, res) => {
  try {
    const { sessionId, processId } = req.params;

    const terminal = terminalSessions.get(sessionId);
    if (!terminal) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }

    const result = await terminal.killProcess(processId);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error(`[Terminal] Process kill failed:`, error);
    res.status(500).json({ 
      error: error.message || 'Process kill failed',
      success: false
    });
  }
});

/**
 * Close terminal session
 * DELETE /terminal/:sessionId
 */
router.delete('/:sessionId', requireJwtAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const terminal = terminalSessions.get(sessionId);
    if (!terminal) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }

    await terminal.cleanup();
    terminalSessions.delete(sessionId);

    logger.info(`[Terminal] Session closed: ${sessionId}`);

    res.json({
      success: true,
      message: 'Terminal session closed'
    });

  } catch (error) {
    logger.error(`[Terminal] Session closure failed:`, error);
    res.status(500).json({ error: 'Session closure failed' });
  }
});

/**
 * List active terminal sessions for user  
 * GET /terminal/sessions
 */
router.get('/sessions', requireJwtAuth, async (req, res) => {
  try {
    const userSessions = [];
    
    for (const [sessionId, terminal] of terminalSessions) {
      // Check if session belongs to current user
      if (sessionId.includes(`term_${req.user.id}_`)) {
        userSessions.push({
          sessionId,
          status: terminal.getStatus()
        });
      }
    }

    res.json({
      success: true,
      sessions: userSessions
    });

  } catch (error) {
    logger.error(`[Terminal] Sessions list failed:`, error);
    res.status(500).json({ error: 'Sessions list failed' });
  }
});

/**
 * AI Agent Terminal Access
 * POST /terminal/agent/:agentName/execute
 * Special endpoint for AI agents to execute commands
 */
router.post('/agent/:agentName/execute', requireJwtAuth, async (req, res) => {
  try {
    const { agentName } = req.params;
    const { command, taskId, workingDirectory } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    // Create temporary agent session
    const sessionId = `agent_${agentName}_${taskId || Date.now()}`;
    const terminal = new MaxEvoTerminal(maxevoCore);
    
    await terminal.initialize(sessionId, {
      workingDirectory,
      secureMode: true // Always secure for agent access
    });

    try {
      const result = await terminal.executeCommand(command);
      
      // Log agent terminal usage
      logger.info(`[Terminal] Agent ${agentName} executed: ${command}`, {
        taskId,
        success: result.success,
        exitCode: result.exitCode
      });

      // Cleanup after execution
      await terminal.cleanup();

      res.json({
        success: true,
        agent: agentName,
        ...result
      });

    } catch (error) {
      await terminal.cleanup();
      throw error;
    }

  } catch (error) {
    logger.error(`[Terminal] Agent command failed:`, error);
    res.status(500).json({ 
      error: error.message || 'Agent command execution failed',
      success: false
    });
  }
});

// Cleanup inactive sessions periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes

  for (const [sessionId, terminal] of terminalSessions) {
    const status = terminal.getStatus();
    const lastActivity = status.lastActivity ? new Date(status.lastActivity).getTime() : 0;
    
    if (now - lastActivity > maxAge) {
      logger.info(`[Terminal] Cleaning up inactive session: ${sessionId}`);
      terminal.cleanup().catch(err => 
        logger.error(`[Terminal] Cleanup failed for ${sessionId}:`, err)
      );
      terminalSessions.delete(sessionId);
    }
  }
}, 10 * 60 * 1000); // Check every 10 minutes

module.exports = router;