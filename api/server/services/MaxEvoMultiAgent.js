const { EventEmitter } = require('events');
const { logger } = require('~/utils/logger');

/**
 * MaxEvo Multi-Agent Chat System
 * Real-time collaboration between Claude (executor) and GPT (fact-checker)
 */
class MaxEvoMultiAgent extends EventEmitter {
  constructor(maxevoCore) {
    super();
    this.maxevoCore = maxevoCore;
    this.activeConversations = new Map();
    this.agentConnections = new Map();
  }

  /**
   * Initialize multi-agent system
   */
  async initialize() {
    try {
      logger.info('[MaxEvo MultiAgent] Initializing multi-agent chat system');
      
      // Set up agent capabilities
      this.agents = {
        claude: {
          name: 'Claude',
          role: 'executor',
          capabilities: ['coding', 'analysis', 'reasoning', 'execution'],
          status: 'available',
          color: '#FF6B35'
        },
        gpt: {
          name: 'Atlas (GPT-4)',
          role: 'fact_checker',
          capabilities: ['fact_checking', 'validation', 'oversight', 'research'],
          status: 'available', 
          color: '#10A37F'
        }
      };

      logger.info('[MaxEvo MultiAgent] Multi-agent system initialized');
    } catch (error) {
      logger.error('[MaxEvo MultiAgent] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create new multi-agent conversation
   */
  async createConversation(userId, taskId, options = {}) {
    try {
      const conversationId = `conv_${userId}_${Date.now()}`;
      
      const conversation = {
        id: conversationId,
        userId,
        taskId,
        created: new Date().toISOString(),
        status: 'active',
        participants: ['claude', 'gpt'],
        messages: [],
        factCheckingEnabled: options.factCheckingEnabled !== false,
        realTimeValidation: options.realTimeValidation !== false,
        autoApproval: options.autoApproval || false,
        context: options.context || {},
        metrics: {
          messagesTotal: 0,
          factChecksPerformed: 0,
          validationsPassed: 0,
          validationsFailed: 0,
          executionsBlocked: 0,
          executionsApproved: 0
        }
      };

      this.activeConversations.set(conversationId, conversation);
      
      // Log conversation creation
      await this.logMultiAgentEvent('conversation_created', conversationId, {
        userId,
        taskId,
        factCheckingEnabled: conversation.factCheckingEnabled
      });

      logger.info(`[MaxEvo MultiAgent] Conversation created: ${conversationId}`);
      
      return conversation;

    } catch (error) {
      logger.error('[MaxEvo MultiAgent] Failed to create conversation:', error);
      throw error;
    }
  }

  /**
   * Send message with real-time fact-checking
   */
  async sendMessage(conversationId, fromAgent, message, metadata = {}) {
    try {
      const conversation = this.activeConversations.get(conversationId);
      if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      const messageObj = {
        id: messageId,
        conversationId,
        fromAgent,
        content: message,
        timestamp,
        metadata,
        factCheckStatus: null,
        validationResult: null,
        approved: null
      };

      // Add message to conversation
      conversation.messages.push(messageObj);
      conversation.metrics.messagesTotal++;

      // Emit real-time event
      this.emit('message', {
        conversationId,
        message: messageObj
      });

      // Trigger fact-checking if enabled and message is from executor
      if (conversation.factCheckingEnabled && fromAgent === 'claude') {
        await this.performFactCheck(conversationId, messageId);
      }

      logger.debug(`[MaxEvo MultiAgent] Message sent: ${messageId} from ${fromAgent}`);
      
      return messageObj;

    } catch (error) {
      logger.error('[MaxEvo MultiAgent] Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Perform real-time fact-checking
   */
  async performFactCheck(conversationId, messageId) {
    try {
      const conversation = this.activeConversations.get(conversationId);
      const message = conversation.messages.find(m => m.id === messageId);
      
      if (!message) {
        throw new Error(`Message not found: ${messageId}`);
      }

      // Update message status
      message.factCheckStatus = 'checking';
      
      // Emit fact-check started event
      this.emit('factCheckStarted', {
        conversationId,
        messageId,
        content: message.content
      });

      // Simulate GPT fact-checking (this would call actual GPT API)
      const factCheckResult = await this.callGPTFactChecker(message, conversation);
      
      // Update message with fact-check result
      message.factCheckStatus = 'completed';
      message.validationResult = factCheckResult;
      message.approved = factCheckResult.approved;

      // Update metrics
      conversation.metrics.factChecksPerformed++;
      if (factCheckResult.approved) {
        conversation.metrics.validationsPassed++;
        conversation.metrics.executionsApproved++;
      } else {
        conversation.metrics.validationsFailed++;
        conversation.metrics.executionsBlocked++;
      }

      // Emit fact-check completed event
      this.emit('factCheckCompleted', {
        conversationId,
        messageId,
        result: factCheckResult
      });

      // Send GPT's response as a new message
      await this.sendMessage(conversationId, 'gpt', factCheckResult.response, {
        type: 'fact_check_response',
        originalMessageId: messageId,
        approved: factCheckResult.approved,
        confidence: factCheckResult.confidence
      });

      logger.info(`[MaxEvo MultiAgent] Fact-check completed for ${messageId}: ${factCheckResult.approved ? 'APPROVED' : 'BLOCKED'}`);

    } catch (error) {
      logger.error(`[MaxEvo MultiAgent] Fact-check failed for ${messageId}:`, error);
      
      // Update message with error
      const conversation = this.activeConversations.get(conversationId);
      const message = conversation.messages.find(m => m.id === messageId);
      if (message) {
        message.factCheckStatus = 'error';
        message.validationResult = { error: error.message };
      }
    }
  }

  /**
   * Call GPT for fact-checking (simulated)
   */
  async callGPTFactChecker(message, conversation) {
    try {
      // Simulate fact-checking logic
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      const content = message.content.toLowerCase();
      const metadata = message.metadata || {};

      // Risk assessment
      const riskFactors = {
        hasFileOperations: /write|delete|modify|create.*file/i.test(content),
        hasSystemCommands: /sudo|rm|chmod|format|delete/i.test(content),
        hasNetworkOperations: /curl|wget|api|http/i.test(content),
        hasExecutableOperations: /exec|run|execute|compile/i.test(content),
        isHighPriority: metadata.priority === 'high',
        isProductionEnvironment: /production|prod|live/i.test(content)
      };

      const riskScore = Object.values(riskFactors).filter(Boolean).length;
      const approved = riskScore < 3; // Approve if low risk
      const confidence = Math.max(0.6, 0.95 - (riskScore * 0.1));

      let response = '';
      let reasoning = [];

      if (approved) {
        response = `✅ **APPROVED** - Action validated by Atlas\n\n`;
        reasoning.push('Code appears safe and follows best practices');
        
        if (riskScore > 0) {
          response += `⚠️ **Minor concerns noted:**\n`;
          if (riskFactors.hasFileOperations) reasoning.push('File operations detected - ensure proper error handling');
          if (riskFactors.hasNetworkOperations) reasoning.push('Network operations - verify endpoints and authentication');
          if (riskFactors.hasExecutableOperations) reasoning.push('Executable operations - confirm in safe environment');
        }
      } else {
        response = `❌ **BLOCKED** - Action requires review\n\n`;
        response += `🚨 **Risk factors identified:**\n`;
        
        if (riskFactors.hasSystemCommands) reasoning.push('System commands detected - potential security risk');
        if (riskFactors.hasFileOperations && riskFactors.isProductionEnvironment) reasoning.push('File operations in production environment');
        if (riskFactors.isHighPriority && riskScore > 2) reasoning.push('High priority task with multiple risk factors');
        
        response += `\n**Recommendation:** Manual review required before execution.`;
      }

      if (reasoning.length > 0) {
        response += `\n\n**Analysis:**\n• ${reasoning.join('\n• ')}`;
      }

      response += `\n\n*Confidence: ${Math.round(confidence * 100)}% | Risk Score: ${riskScore}/6*`;

      return {
        approved,
        confidence,
        riskScore,
        riskFactors,
        response,
        reasoning,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('[MaxEvo MultiAgent] GPT fact-checker error:', error);
      
      return {
        approved: false,
        confidence: 0,
        error: error.message,
        response: `❌ **ERROR** - Fact-checking failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute approved actions
   */
  async executeAction(conversationId, messageId, actionData) {
    try {
      const conversation = this.activeConversations.get(conversationId);
      const message = conversation.messages.find(m => m.id === messageId);

      if (!message) {
        throw new Error(`Message not found: ${messageId}`);
      }

      if (!message.approved) {
        throw new Error('Action not approved for execution');
      }

      // Log execution attempt
      await this.logMultiAgentEvent('action_executed', conversationId, {
        messageId,
        actionType: actionData.type,
        approved: message.approved
      });

      // Emit execution event
      this.emit('actionExecuted', {
        conversationId,
        messageId,
        actionData,
        validationResult: message.validationResult
      });

      return {
        success: true,
        messageId,
        executed: true,
        validationResult: message.validationResult
      };

    } catch (error) {
      logger.error(`[MaxEvo MultiAgent] Action execution failed:`, error);
      throw error;
    }
  }

  /**
   * Get conversation with full history
   */
  getConversation(conversationId) {
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) {
      return null;
    }

    return {
      ...conversation,
      agents: this.agents,
      messages: conversation.messages.slice() // Return copy
    };
  }

  /**
   * Get conversation statistics
   */
  getConversationStats(conversationId) {
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) {
      return null;
    }

    return {
      id: conversationId,
      duration: Date.now() - new Date(conversation.created).getTime(),
      ...conversation.metrics,
      approvalRate: conversation.metrics.factChecksPerformed > 0 
        ? (conversation.metrics.validationsPassed / conversation.metrics.factChecksPerformed) * 100 
        : 0
    };
  }

  /**
   * Close conversation
   */
  async closeConversation(conversationId) {
    try {
      const conversation = this.activeConversations.get(conversationId);
      if (!conversation) {
        return false;
      }

      conversation.status = 'closed';
      conversation.closedAt = new Date().toISOString();

      // Save to memory
      if (this.maxevoCore) {
        const state = this.maxevoCore.getState();
        if (!state.memory.conversations) {
          state.memory.conversations = {};
        }
        state.memory.conversations[conversationId] = conversation;
        await this.maxevoCore.updateState({ memory: state.memory });
      }

      // Remove from active conversations
      this.activeConversations.delete(conversationId);

      await this.logMultiAgentEvent('conversation_closed', conversationId, {
        duration: Date.now() - new Date(conversation.created).getTime(),
        messageCount: conversation.messages.length,
        metrics: conversation.metrics
      });

      logger.info(`[MaxEvo MultiAgent] Conversation closed: ${conversationId}`);
      
      return true;

    } catch (error) {
      logger.error(`[MaxEvo MultiAgent] Failed to close conversation:`, error);
      throw error;
    }
  }

  /**
   * Get active conversations for user
   */
  getUserConversations(userId) {
    const userConversations = [];
    
    for (const [id, conversation] of this.activeConversations) {
      if (conversation.userId === userId) {
        userConversations.push({
          id,
          taskId: conversation.taskId,
          created: conversation.created,
          status: conversation.status,
          messageCount: conversation.messages.length,
          lastActivity: conversation.messages.length > 0 
            ? conversation.messages[conversation.messages.length - 1].timestamp
            : conversation.created
        });
      }
    }

    return userConversations;
  }

  /**
   * Log multi-agent events
   */
  async logMultiAgentEvent(eventType, conversationId, data) {
    try {
      logger.info(`[MaxEvo MultiAgent] Event: ${eventType}`, {
        conversationId,
        ...data
      });
    } catch (error) {
      logger.error('[MaxEvo MultiAgent] Failed to log event:', error);
    }
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      activeConversations: this.activeConversations.size,
      agents: this.agents,
      totalEvents: this.eventNames().length
    };
  }
}

module.exports = MaxEvoMultiAgent;