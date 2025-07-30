const WebSocket = require('ws');
const { logger } = require('~/utils/logger');
const MaxEvoMultiAgent = require('./MaxEvoMultiAgent');

/**
 * MaxEvo WebSocket Server
 * Real-time communication for multi-agent interactions
 */
class MaxEvoWebSocket {
  constructor(server, maxevoCore) {
    this.server = server;
    this.maxevoCore = maxevoCore;
    this.wss = null;
    this.clients = new Map();
    this.rooms = new Map();
    this.multiAgent = null;
  }

  /**
   * Initialize WebSocket server
   */
  async initialize() {
    try {
      // Create WebSocket server
      this.wss = new WebSocket.Server({ 
        server: this.server,
        path: '/maxevo-ws'
      });

      // Initialize multi-agent system
      this.multiAgent = new MaxEvoMultiAgent(this.maxevoCore);
      await this.multiAgent.initialize();

      // Set up multi-agent event listeners
      this.setupMultiAgentListeners();

      // Handle WebSocket connections
      this.wss.on('connection', (ws, req) => {
        this.handleConnection(ws, req);
      });

      logger.info('[MaxEvo WebSocket] Server initialized on /maxevo-ws');

    } catch (error) {
      logger.error('[MaxEvo WebSocket] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    try {
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const userAgent = req.headers['user-agent'] || 'unknown';
      const ip = req.connection.remoteAddress;

      const client = {
        id: clientId,
        ws,
        userId: null,
        rooms: new Set(),
        authenticated: false,
        connectedAt: new Date().toISOString(),
        userAgent,
        ip,
        lastPing: Date.now()
      };

      this.clients.set(clientId, client);
      
      logger.info(`[MaxEvo WebSocket] Client connected: ${clientId}`);

      // Set up message handling
      ws.on('message', (data) => {
        this.handleMessage(clientId, data);
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error(`[MaxEvo WebSocket] Client error ${clientId}:`, error);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'welcome',
        clientId,
        timestamp: new Date().toISOString(),
        message: 'Connected to MaxEvo Multi-Agent System'
      });

      // Set up ping/pong for connection health
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          client.lastPing = Date.now();
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000); // Ping every 30 seconds

      ws.on('pong', () => {
        client.lastPing = Date.now();
      });

    } catch (error) {
      logger.error('[MaxEvo WebSocket] Connection handling failed:', error);
    }
  }

  /**
   * Handle incoming messages from clients
   */
  async handleMessage(clientId, data) {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      const message = JSON.parse(data.toString());
      const { type, payload } = message;

      logger.debug(`[MaxEvo WebSocket] Message from ${clientId}: ${type}`);

      switch (type) {
        case 'authenticate':
          await this.handleAuthentication(clientId, payload);
          break;

        case 'join_conversation':
          await this.joinConversation(clientId, payload.conversationId);
          break;

        case 'leave_conversation':
          await this.leaveConversation(clientId, payload.conversationId);
          break;

        case 'send_message':
          await this.handleSendMessage(clientId, payload);
          break;

        case 'create_conversation':
          await this.handleCreateConversation(clientId, payload);
          break;

        case 'execute_action':
          await this.handleExecuteAction(clientId, payload);
          break;

        case 'get_conversation':
          await this.handleGetConversation(clientId, payload);
          break;

        case 'get_status':
          await this.handleGetStatus(clientId);
          break;

        default:
          this.sendError(clientId, `Unknown message type: ${type}`);
      }

    } catch (error) {
      logger.error(`[MaxEvo WebSocket] Message handling failed for ${clientId}:`, error);
      this.sendError(clientId, error.message);
    }
  }

  /**
   * Handle client authentication
   */
  async handleAuthentication(clientId, payload) {
    try {
      const client = this.clients.get(clientId);
      const { token, userId } = payload;

      // TODO: Implement proper JWT validation
      // For now, simulate authentication
      if (token && userId) {
        client.authenticated = true;
        client.userId = userId;

        this.sendToClient(clientId, {
          type: 'authenticated',
          success: true,
          userId,
          timestamp: new Date().toISOString()
        });

        logger.info(`[MaxEvo WebSocket] Client authenticated: ${clientId} as user ${userId}`);
      } else {
        throw new Error('Invalid authentication credentials');
      }

    } catch (error) {
      this.sendError(clientId, `Authentication failed: ${error.message}`);
    }
  }

  /**
   * Join conversation room
   */
  async joinConversation(clientId, conversationId) {
    try {
      const client = this.clients.get(clientId);
      if (!client.authenticated) {
        throw new Error('Authentication required');
      }

      // Add client to room
      if (!this.rooms.has(conversationId)) {
        this.rooms.set(conversationId, new Set());
      }
      
      this.rooms.get(conversationId).add(clientId);
      client.rooms.add(conversationId);

      // Get conversation data
      const conversation = this.multiAgent.getConversation(conversationId);

      this.sendToClient(clientId, {
        type: 'joined_conversation',
        conversationId,
        conversation,
        timestamp: new Date().toISOString()
      });

      // Notify other clients in the room
      this.broadcastToRoom(conversationId, {
        type: 'user_joined',
        conversationId,
        userId: client.userId,
        timestamp: new Date().toISOString()
      }, clientId);

      logger.info(`[MaxEvo WebSocket] Client ${clientId} joined conversation ${conversationId}`);

    } catch (error) {
      this.sendError(clientId, `Failed to join conversation: ${error.message}`);
    }
  }

  /**
   * Leave conversation room
   */
  async leaveConversation(clientId, conversationId) {
    try {
      const client = this.clients.get(clientId);
      
      if (this.rooms.has(conversationId)) {
        this.rooms.get(conversationId).delete(clientId);
        
        // Clean up empty rooms
        if (this.rooms.get(conversationId).size === 0) {
          this.rooms.delete(conversationId);
        }
      }

      client.rooms.delete(conversationId);

      this.sendToClient(clientId, {
        type: 'left_conversation',
        conversationId,
        timestamp: new Date().toISOString()
      });

      logger.info(`[MaxEvo WebSocket] Client ${clientId} left conversation ${conversationId}`);

    } catch (error) {
      this.sendError(clientId, `Failed to leave conversation: ${error.message}`);
    }
  }

  /**
   * Handle create conversation
   */
  async handleCreateConversation(clientId, payload) {
    try {
      const client = this.clients.get(clientId);
      if (!client.authenticated) {
        throw new Error('Authentication required');
      }

      const conversation = await this.multiAgent.createConversation(
        client.userId,
        payload.taskId,
        payload.options
      );

      // Auto-join the creator to the conversation
      await this.joinConversation(clientId, conversation.id);

      this.sendToClient(clientId, {
        type: 'conversation_created',
        conversation,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.sendError(clientId, `Failed to create conversation: ${error.message}`);
    }
  }

  /**
   * Handle send message
   */
  async handleSendMessage(clientId, payload) {
    try {
      const client = this.clients.get(clientId);
      if (!client.authenticated) {
        throw new Error('Authentication required');
      }

      const { conversationId, fromAgent, message, metadata } = payload;

      // Verify client is in the conversation room
      if (!client.rooms.has(conversationId)) {
        throw new Error('Not joined to conversation');
      }

      const messageObj = await this.multiAgent.sendMessage(
        conversationId,
        fromAgent,
        message,
        metadata
      );

      // Message will be broadcast via multi-agent events
      
    } catch (error) {
      this.sendError(clientId, `Failed to send message: ${error.message}`);
    }
  }

  /**
   * Handle execute action
   */
  async handleExecuteAction(clientId, payload) {
    try {
      const client = this.clients.get(clientId);
      if (!client.authenticated) {
        throw new Error('Authentication required');
      }

      const { conversationId, messageId, actionData } = payload;

      const result = await this.multiAgent.executeAction(
        conversationId,
        messageId,
        actionData
      );

      this.sendToClient(clientId, {
        type: 'action_executed',
        result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.sendError(clientId, `Failed to execute action: ${error.message}`);
    }
  }

  /**
   * Handle get conversation
   */
  async handleGetConversation(clientId, payload) {
    try {
      const { conversationId } = payload;
      const conversation = this.multiAgent.getConversation(conversationId);

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      this.sendToClient(clientId, {
        type: 'conversation_data',
        conversation,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.sendError(clientId, `Failed to get conversation: ${error.message}`);
    }
  }

  /**
   * Handle get status
   */
  async handleGetStatus(clientId) {
    try {
      const status = {
        multiAgent: this.multiAgent.getStatus(),
        websocket: {
          connectedClients: this.clients.size,
          activeRooms: this.rooms.size
        },
        timestamp: new Date().toISOString()
      };

      this.sendToClient(clientId, {
        type: 'status',
        status,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.sendError(clientId, `Failed to get status: ${error.message}`);
    }
  }

  /**
   * Set up multi-agent event listeners
   */
  setupMultiAgentListeners() {
    // New message event
    this.multiAgent.on('message', (data) => {
      this.broadcastToRoom(data.conversationId, {
        type: 'new_message',
        ...data,
        timestamp: new Date().toISOString()
      });
    });

    // Fact-check started event
    this.multiAgent.on('factCheckStarted', (data) => {
      this.broadcastToRoom(data.conversationId, {
        type: 'fact_check_started',
        ...data,
        timestamp: new Date().toISOString()
      });
    });

    // Fact-check completed event
    this.multiAgent.on('factCheckCompleted', (data) => {
      this.broadcastToRoom(data.conversationId, {
        type: 'fact_check_completed',
        ...data,
        timestamp: new Date().toISOString()
      });
    });

    // Action executed event
    this.multiAgent.on('actionExecuted', (data) => {
      this.broadcastToRoom(data.conversationId, {
        type: 'action_executed',
        ...data,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(clientId) {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      // Remove client from all rooms
      for (const conversationId of client.rooms) {
        if (this.rooms.has(conversationId)) {
          this.rooms.get(conversationId).delete(clientId);
          
          // Clean up empty rooms
          if (this.rooms.get(conversationId).size === 0) {
            this.rooms.delete(conversationId);
          }
        }
      }

      // Remove client
      this.clients.delete(clientId);

      logger.info(`[MaxEvo WebSocket] Client disconnected: ${clientId}`);

    } catch (error) {
      logger.error(`[MaxEvo WebSocket] Disconnect handling failed for ${clientId}:`, error);
    }
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, message) {
    try {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    } catch (error) {
      logger.error(`[MaxEvo WebSocket] Failed to send message to ${clientId}:`, error);
    }
  }

  /**
   * Send error message to client
   */
  sendError(clientId, errorMessage) {
    this.sendToClient(clientId, {
      type: 'error',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast message to all clients in a room
   */
  broadcastToRoom(roomId, message, excludeClientId = null) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) return;

      for (const clientId of room) {
        if (clientId !== excludeClientId) {
          this.sendToClient(clientId, message);
        }
      }
    } catch (error) {
      logger.error(`[MaxEvo WebSocket] Failed to broadcast to room ${roomId}:`, error);
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(message, excludeClientId = null) {
    try {
      for (const [clientId, client] of this.clients) {
        if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
          this.sendToClient(clientId, message);
        }
      }
    } catch (error) {
      logger.error('[MaxEvo WebSocket] Failed to broadcast message:', error);
    }
  }

  /**
   * Get WebSocket server status
   */
  getStatus() {
    return {
      clients: this.clients.size,
      rooms: this.rooms.size,
      multiAgent: this.multiAgent ? this.multiAgent.getStatus() : null
    };
  }

  /**
   * Clean up dead connections
   */
  cleanup() {
    const now = Date.now();
    const timeout = 60000; // 1 minute timeout

    for (const [clientId, client] of this.clients) {
      if (now - client.lastPing > timeout) {
        logger.info(`[MaxEvo WebSocket] Cleaning up dead connection: ${clientId}`);
        client.ws.terminate();
        this.handleDisconnect(clientId);
      }
    }
  }
}

module.exports = MaxEvoWebSocket;