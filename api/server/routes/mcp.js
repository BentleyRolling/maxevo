const { Router } = require('express');
const { MCPOAuthHandler } = require('@librechat/api');
const { logger } = require('@librechat/data-schemas');
const { CacheKeys } = require('librechat-data-provider');
const { requireJwtAuth } = require('~/server/middleware');
const { getFlowStateManager } = require('~/config');
const { getLogStores } = require('~/cache');
const MaxEvoCore = require('~/server/services/MaxEvoCore');

const router = Router();

// Initialize MaxEvo Core
let maxevoCore = null;
let maxevoCoreInitialized = false;

const initializeMaxEvoCore = async () => {
  if (maxevoCoreInitialized) return maxevoCore;
  
  try {
    maxevoCore = new MaxEvoCore();
    await maxevoCore.initialize();
    maxevoCoreInitialized = true;
    logger.info('[MCP Routes] MaxEvo Core initialized successfully');
    return maxevoCore;
  } catch (error) {
    logger.warn('[MCP Routes] MaxEvo Core initialization failed, using fallback mode:', error?.message || 'Unknown error');
    maxevoCore = null;
    maxevoCoreInitialized = true;
    return null;
  }
};

/**
 * Initiate OAuth flow
 * This endpoint is called when the user clicks the auth link in the UI
 */
router.get('/:serverName/oauth/initiate', requireJwtAuth, async (req, res) => {
  try {
    const { serverName } = req.params;
    const { userId, flowId } = req.query;
    const user = req.user;

    // Verify the userId matches the authenticated user
    if (userId !== user.id) {
      return res.status(403).json({ error: 'User mismatch' });
    }

    logger.debug('[MCP OAuth] Initiate request', { serverName, userId, flowId });

    const flowsCache = getLogStores(CacheKeys.FLOWS);
    const flowManager = getFlowStateManager(flowsCache);

    /** Flow state to retrieve OAuth config */
    const flowState = await flowManager.getFlowState(flowId, 'mcp_oauth');
    if (!flowState) {
      logger.error('[MCP OAuth] Flow state not found', { flowId });
      return res.status(404).json({ error: 'Flow not found' });
    }

    const { serverUrl, oauth: oauthConfig } = flowState.metadata || {};
    if (!serverUrl || !oauthConfig) {
      logger.error('[MCP OAuth] Missing server URL or OAuth config in flow state');
      return res.status(400).json({ error: 'Invalid flow state' });
    }

    const { authorizationUrl, flowId: oauthFlowId } = await MCPOAuthHandler.initiateOAuthFlow(
      serverName,
      serverUrl,
      userId,
      oauthConfig,
    );

    logger.debug('[MCP OAuth] OAuth flow initiated', { oauthFlowId, authorizationUrl });

    // Redirect user to the authorization URL
    res.redirect(authorizationUrl);
  } catch (error) {
    logger.error('[MCP OAuth] Failed to initiate OAuth', error);
    res.status(500).json({ error: 'Failed to initiate OAuth' });
  }
});

/**
 * OAuth callback handler
 * This handles the OAuth callback after the user has authorized the application
 */
router.get('/:serverName/oauth/callback', async (req, res) => {
  try {
    const { serverName } = req.params;
    const { code, state, error: oauthError } = req.query;

    logger.debug('[MCP OAuth] Callback received', {
      serverName,
      code: code ? 'present' : 'missing',
      state,
      error: oauthError,
    });

    if (oauthError) {
      logger.error('[MCP OAuth] OAuth error received', { error: oauthError });
      return res.redirect(`/oauth/error?error=${encodeURIComponent(String(oauthError))}`);
    }

    if (!code || typeof code !== 'string') {
      logger.error('[MCP OAuth] Missing or invalid code');
      return res.redirect('/oauth/error?error=missing_code');
    }

    if (!state || typeof state !== 'string') {
      logger.error('[MCP OAuth] Missing or invalid state');
      return res.redirect('/oauth/error?error=missing_state');
    }

    // Extract flow ID from state
    const flowId = state;
    logger.debug('[MCP OAuth] Using flow ID from state', { flowId });

    const flowsCache = getLogStores(CacheKeys.FLOWS);
    const flowManager = getFlowStateManager(flowsCache);

    logger.debug('[MCP OAuth] Getting flow state for flowId: ' + flowId);
    const flowState = await MCPOAuthHandler.getFlowState(flowId, flowManager);

    if (!flowState) {
      logger.error('[MCP OAuth] Flow state not found for flowId:', flowId);
      return res.redirect('/oauth/error?error=invalid_state');
    }

    logger.debug('[MCP OAuth] Flow state details', {
      serverName: flowState.serverName,
      userId: flowState.userId,
      hasMetadata: !!flowState.metadata,
      hasClientInfo: !!flowState.clientInfo,
      hasCodeVerifier: !!flowState.codeVerifier,
    });

    // Complete the OAuth flow
    logger.debug('[MCP OAuth] Completing OAuth flow');
    const tokens = await MCPOAuthHandler.completeOAuthFlow(flowId, code, flowManager);
    logger.info('[MCP OAuth] OAuth flow completed, tokens received in callback route');

    // For system-level OAuth, we need to store the tokens and retry the connection
    if (flowState.userId === 'system') {
      logger.debug(`[MCP OAuth] System-level OAuth completed for ${serverName}`);
    }

    /** ID of the flow that the tool/connection is waiting for */
    const toolFlowId = flowState.metadata?.toolFlowId;
    if (toolFlowId) {
      logger.debug('[MCP OAuth] Completing tool flow', { toolFlowId });
      await flowManager.completeFlow(toolFlowId, 'mcp_oauth', tokens);
    }

    /** Redirect to success page with flowId and serverName */
    const redirectUrl = `/oauth/success?serverName=${encodeURIComponent(serverName)}`;
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error('[MCP OAuth] OAuth callback error', error);
    res.redirect('/oauth/error?error=callback_failed');
  }
});

/**
 * Get OAuth tokens for a completed flow
 * This is primarily for user-level OAuth flows
 */
router.get('/oauth/tokens/:flowId', requireJwtAuth, async (req, res) => {
  try {
    const { flowId } = req.params;
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Allow system flows or user-owned flows
    if (!flowId.startsWith(`${user.id}:`) && !flowId.startsWith('system:')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const flowsCache = getLogStores(CacheKeys.FLOWS);
    const flowManager = getFlowStateManager(flowsCache);

    const flowState = await flowManager.getFlowState(flowId, 'mcp_oauth');
    if (!flowState) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    if (flowState.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Flow not completed' });
    }

    res.json({ tokens: flowState.result });
  } catch (error) {
    logger.error('[MCP OAuth] Failed to get tokens', error);
    res.status(500).json({ error: 'Failed to get tokens' });
  }
});

/**
 * Check OAuth flow status
 * This endpoint can be used to poll the status of an OAuth flow
 */
router.get('/oauth/status/:flowId', async (req, res) => {
  try {
    const { flowId } = req.params;
    const flowsCache = getLogStores(CacheKeys.FLOWS);
    const flowManager = getFlowStateManager(flowsCache);

    const flowState = await flowManager.getFlowState(flowId, 'mcp_oauth');
    if (!flowState) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    res.json({
      status: flowState.status,
      completed: flowState.status === 'COMPLETED',
      failed: flowState.status === 'FAILED',
      error: flowState.error,
    });
  } catch (error) {
    logger.error('[MCP OAuth] Failed to get flow status', error);
    res.status(500).json({ error: 'Failed to get flow status' });
  }
});

/**
 * MaxEvo MCP Host Endpoints
 * Core endpoints for MaxEvo AI Operating System
 */

/**
 * Trigger a MaxEvo task or workflow
 * POST /mcp/trigger
 */
router.post('/trigger', requireJwtAuth, async (req, res) => {
  try {
    const core = await initializeMaxEvoCore();
    if (!core) {
      return res.status(503).json({ error: 'MaxEvo Core not available' });
    }

    const { task, agent, payload, runAt, priority = 'medium' } = req.body;
    
    if (!task) {
      return res.status(400).json({ error: 'Task is required' });
    }

    // Create task object
    const taskData = {
      task,
      agent: agent || 'claude',
      payload: payload || {},
      priority,
      triggeredBy: req.user.id,
      triggeredAt: new Date().toISOString()
    };

    // If runAt is specified, it's a scheduled task
    if (runAt) {
      taskData.runAt = runAt;
      taskData.status = 'scheduled';
    }

    const createdTask = await core.addTask(taskData);
    
    logger.info(`[MCP Trigger] Task created: ${createdTask.id} by user ${req.user.id}`);
    
    res.json({
      success: true,
      task: createdTask,
      message: runAt ? 'Task scheduled successfully' : 'Task queued successfully'
    });

  } catch (error) {
    logger.error('[MCP Trigger] Failed to trigger task:', error);
    res.status(500).json({ error: 'Failed to trigger task' });
  }
});

/**
 * Log MaxEvo system events and agent activities
 * POST /mcp/log
 */
router.post('/log', requireJwtAuth, async (req, res) => {
  try {
    const core = await initializeMaxEvoCore();
    if (!core) {
      return res.status(503).json({ error: 'MaxEvo Core not available' });
    }

    const { level, message, agent, taskId, metadata } = req.body;
    
    if (!level || !message) {
      return res.status(400).json({ error: 'Level and message are required' });
    }

    // Log the event using Winston
    const logData = {
      agent: agent || 'system',
      taskId: taskId || null,
      userId: req.user.id,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    };

    logger[level] || logger.info(`[MaxEvo ${agent || 'System'}] ${message}`, logData);

    // Update agent status if provided
    if (agent && taskId) {
      await core.updateAgentStatus(agent, 'active', taskId);
    }

    res.json({ success: true, logged: true });

  } catch (error) {
    logger.error('[MCP Log] Failed to log event:', error);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

/**
 * Fetch MaxEvo memory and system state
 * GET /mcp/fetchMemory
 */
router.get('/fetchMemory', requireJwtAuth, async (req, res) => {
  try {
    const core = await initializeMaxEvoCore();
    if (!core) {
      return res.status(503).json({ error: 'MaxEvo Core not available' });
    }

    const { type, agent, taskId } = req.query;
    const state = core.getState();
    
    let responseData = {};

    switch (type) {
      case 'full':
        responseData = state;
        break;
      case 'agents':
        responseData = state.agents;
        break;
      case 'memory':
        responseData = state.memory;
        break;
      case 'tasks':
        responseData = {
          pending: maxevoCore.getTasks('pending'),
          scheduled: maxevoCore.getTasks('scheduled'),
          active: maxevoCore.getTasks('active')
        };
        break;
      case 'agent':
        if (agent && state.agents[agent]) {
          responseData = state.agents[agent];
        } else {
          return res.status(404).json({ error: 'Agent not found' });
        }
        break;
      case 'resurrection':
        responseData = maxevoCore.getResurrectionData();
        break;
      default:
        responseData = {
          systemInfo: state.systemInfo,
          activeAgents: Object.keys(state.agents).filter(
            agentName => state.agents[agentName].status === 'active'
          ),
          pendingTasks: maxevoCore.getTasks('pending').length,
          lastUpdated: state.lastUpdated
        };
    }

    logger.debug(`[MCP FetchMemory] Memory fetched (type: ${type}) by user ${req.user.id}`);
    
    res.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[MCP FetchMemory] Failed to fetch memory:', error);
    res.status(500).json({ error: 'Failed to fetch memory' });
  }
});

/**
 * Get MaxEvo system status
 * GET /mcp/status
 */
router.get('/status', requireJwtAuth, async (req, res) => {
  try {
    if (!maxevoCore) {
      return res.status(503).json({ 
        error: 'MaxEvo Core not initialized',
        status: 'offline'
      });
    }

    const state = maxevoCore.getState();
    const tasks = maxevoCore.getTasks();
    
    const status = {
      system: 'online',
      version: state.version,
      uptime: Date.now() - new Date(state.systemInfo.lastRestart).getTime(),
      agents: state.agents,
      tasks: {
        pending: tasks.filter(t => t.status === 'pending').length,
        scheduled: tasks.filter(t => t.status === 'scheduled').length,
        active: tasks.filter(t => t.status === 'active').length
      },
      memory: {
        conversations: Object.keys(state.memory.conversations).length,
        contexts: Object.keys(state.memory.contexts).length,
        learnings: Object.keys(state.memory.learnings).length
      },
      lastUpdated: state.lastUpdated
    };

    res.json({
      success: true,
      status
    });

  } catch (error) {
    logger.error('[MCP Status] Failed to get status:', error);
    res.status(500).json({ 
      error: 'Failed to get status',
      status: 'error'
    });
  }
});

/**
 * Update MaxEvo agent status
 * POST /mcp/agent/:agentName/status
 */
router.post('/agent/:agentName/status', requireJwtAuth, async (req, res) => {
  try {
    if (!maxevoCore) {
      return res.status(503).json({ error: 'MaxEvo Core not initialized' });
    }

    const { agentName } = req.params;
    const { status, currentTask, metadata } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    await maxevoCore.updateAgentStatus(agentName, status, currentTask);
    
    logger.info(`[MCP Agent] ${agentName} status updated to ${status} by user ${req.user.id}`);
    
    res.json({
      success: true,
      agent: agentName,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[MCP Agent] Failed to update agent status:', error);
    res.status(500).json({ error: 'Failed to update agent status' });
  }
});

module.exports = router;
