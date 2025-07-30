const { logger } = require('~/utils');
const axios = require('axios');

/**
 * MaxEvo Agent Router
 * Routes tasks to Claude, GPT-4, or GPT-3.5 based on complexity, cost, and latency
 */
class MaxEvoAgentRouter {
  constructor(maxevoCore) {
    this.maxevoCore = maxevoCore;
    this.agents = {
      claude: {
        name: 'claude',
        model: 'claude-3-5-sonnet-20241022',
        costPerToken: 0.000015, // Approximate
        maxTokens: 200000,
        strengths: ['coding', 'analysis', 'reasoning', 'long_context'],
        weaknesses: ['real_time_data'],
        status: 'available'
      },
      gpt4: {
        name: 'gpt4',
        model: 'gpt-4-turbo',
        costPerToken: 0.00001,
        maxTokens: 128000,
        strengths: ['general', 'reasoning', 'fact_checking', 'web_search'],
        weaknesses: ['very_long_context'],
        status: 'available'
      },
      gpt35: {
        name: 'gpt35',
        model: 'gpt-3.5-turbo',
        costPerToken: 0.000002,
        maxTokens: 16000,
        strengths: ['speed', 'cost_effective', 'simple_tasks'],
        weaknesses: ['complex_reasoning', 'long_context'],
        status: 'available'
      }
    };
  }

  async initialize() {
    logger.info('[MaxEvo Agent Router] Initialized with agents:', Object.keys(this.agents));
  }

  /**
   * Route task to the most appropriate agent
   */
  async routeTask(task) {
    try {
      const agent = this.selectAgent(task);
      logger.info(`[MaxEvo Agent Router] Routing task ${task.id} to ${agent.name}`);

      // Update agent status
      await this.maxevoCore.updateAgentStatus(agent.name, 'active', task.id);

      // Execute task with selected agent
      const result = await this.executeWithAgent(agent, task);

      // Update agent status back to idle
      await this.maxevoCore.updateAgentStatus(agent.name, 'idle');

      return result;
    } catch (error) {
      logger.error(`[MaxEvo Agent Router] Task routing failed for ${task.id}:`, error);
      throw error;
    }
  }

  /**
   * Select the best agent for a task based on multiple factors
   */
  selectAgent(task) {
    const { task: taskType, payload, priority, agent: preferredAgent } = task;

    // If a specific agent is requested and available, use it
    if (preferredAgent && this.agents[preferredAgent] && this.agents[preferredAgent].status === 'available') {
      return this.agents[preferredAgent];
    }

    // Calculate scores for each available agent
    const scores = {};
    
    for (const [agentName, agent] of Object.entries(this.agents)) {
      if (agent.status !== 'available') continue;
      
      scores[agentName] = this.calculateAgentScore(agent, task);
    }

    // Select agent with highest score
    const bestAgent = Object.entries(scores).reduce((best, [name, score]) => 
      score > best.score ? { name, score } : best, 
      { name: null, score: -1 }
    );

    if (!bestAgent.name) {
      throw new Error('No available agents for task execution');
    }

    return this.agents[bestAgent.name];
  }

  /**
   * Calculate agent suitability score for a task
   */
  calculateAgentScore(agent, task) {
    let score = 0;
    const { task: taskType, payload, priority } = task;

    // Base score from agent capabilities
    if (this.isTaskTypeMatch(taskType, agent.strengths)) {
      score += 10;
    }

    // Penalty for weaknesses
    if (this.isTaskTypeMatch(taskType, agent.weaknesses)) {
      score -= 5;
    }

    // Complexity analysis
    const complexity = this.estimateTaskComplexity(task);
    
    if (complexity === 'high' && agent.name === 'claude') {
      score += 8; // Claude is best for complex tasks
    } else if (complexity === 'medium' && agent.name === 'gpt4') {
      score += 6; // GPT-4 is good for medium complexity
    } else if (complexity === 'low' && agent.name === 'gpt35') {
      score += 8; // GPT-3.5 is perfect for simple tasks
    }

    // Priority considerations
    if (priority === 'high' && agent.name !== 'gpt35') {
      score += 3; // Avoid GPT-3.5 for high priority tasks
    }

    // Cost efficiency (higher score for lower cost)
    score += (1 / agent.costPerToken) * 0.001;

    // Token limit considerations
    const estimatedTokens = this.estimateTokenUsage(task);
    if (estimatedTokens > agent.maxTokens) {
      score -= 20; // Heavy penalty if task exceeds token limit
    }

    return score;
  }

  /**
   * Check if task type matches agent capabilities
   */
  isTaskTypeMatch(taskType, capabilities) {
    const taskTypeMappings = {
      'optimize_new_blog': ['coding', 'analysis', 'reasoning'],
      'system_health_check': ['analysis', 'reasoning'],
      'backup_system_data': ['coding', 'simple_tasks'],
      'analyze_content_performance': ['analysis', 'fact_checking'],
      'fact_check': ['fact_checking', 'web_search'],
      'code_review': ['coding', 'reasoning'],
      'terminal_command': ['coding', 'reasoning'],
      'file_operation': ['coding', 'simple_tasks'],
      'research': ['web_search', 'analysis', 'reasoning'],
      'content_generation': ['general', 'reasoning']
    };

    const requiredCapabilities = taskTypeMappings[taskType] || ['general'];
    return requiredCapabilities.some(cap => capabilities.includes(cap));
  }

  /**
   * Estimate task complexity
   */
  estimateTaskComplexity(task) {
    const { task: taskType, payload } = task;
    
    // Complex tasks
    const complexTasks = [
      'optimize_new_blog',
      'system_health_check', 
      'code_review',
      'terminal_command',
      'research'
    ];
    
    // Simple tasks
    const simpleTasks = [
      'backup_system_data',
      'file_operation',
      'content_generation'
    ];

    if (complexTasks.includes(taskType)) {
      return 'high';
    } else if (simpleTasks.includes(taskType)) {
      return 'low';
    }

    // Check payload complexity
    if (payload && typeof payload === 'object') {
      const payloadSize = JSON.stringify(payload).length;
      if (payloadSize > 5000) return 'high';
      if (payloadSize > 1000) return 'medium';
    }

    return 'medium';
  }

  /**
   * Estimate token usage for a task
   */
  estimateTokenUsage(task) {
    const { payload } = task;
    let baseTokens = 500; // Base overhead

    if (payload) {
      const payloadStr = JSON.stringify(payload);
      baseTokens += Math.ceil(payloadStr.length / 3); // Rough token estimation
    }

    // Task-specific estimates
    const taskTokens = {
      'optimize_new_blog': 10000,
      'system_health_check': 3000,
      'backup_system_data': 1000,
      'analyze_content_performance': 5000,
      'fact_check': 2000,
      'code_review': 8000,
      'terminal_command': 2000,
      'file_operation': 1000,
      'research': 15000,
      'content_generation': 3000
    };

    return baseTokens + (taskTokens[task.task] || 2000);
  }

  /**
   * Execute task with selected agent
   */
  async executeWithAgent(agent, task) {
    try {
      logger.info(`[MaxEvo Agent Router] Executing task ${task.id} with ${agent.name}`);

      // Create prompt for the agent
      const prompt = this.createAgentPrompt(agent, task);
      
      // Execute based on agent type
      let result;
      if (agent.name === 'claude') {
        result = await this.executeWithClaude(prompt, task);
      } else if (agent.name.startsWith('gpt')) {
        result = await this.executeWithGPT(agent, prompt, task);
      }

      // Update agent completion count
      const currentAgent = await this.maxevoCore.getState().agents[agent.name];
      if (currentAgent) {
        currentAgent.completedTasks = (currentAgent.completedTasks || 0) + 1;
        await this.maxevoCore.updateAgentStatus(agent.name, 'idle');
      }

      logger.info(`[MaxEvo Agent Router] Task ${task.id} completed successfully with ${agent.name}`);
      return result;

    } catch (error) {
      logger.error(`[MaxEvo Agent Router] Execution failed with ${agent.name}:`, error);
      throw error;
    }
  }

  /**
   * Create agent-specific prompt
   */
  createAgentPrompt(agent, task) {
    const { task: taskType, payload, priority } = task;
    
    let prompt = `You are ${agent.name} in the MaxEvo AI Operating System.\n\n`;
    prompt += `Task: ${taskType}\n`;
    prompt += `Priority: ${priority}\n`;
    prompt += `Task ID: ${task.id}\n\n`;

    if (payload && Object.keys(payload).length > 0) {
      prompt += `Payload:\n${JSON.stringify(payload, null, 2)}\n\n`;
    }

    // Add agent-specific instructions
    switch (agent.name) {
      case 'claude':
        prompt += `As Claude, focus on thorough analysis, detailed reasoning, and high-quality code execution. Use your full context window efficiently.`;
        break;
      case 'gpt4':
        prompt += `As GPT-4, provide balanced reasoning and fact-checking. You have access to current information and should verify claims when possible.`;
        break;
      case 'gpt35':
        prompt += `As GPT-3.5, focus on efficiency and speed. Provide concise, accurate responses for straightforward tasks.`;
        break;
    }

    prompt += `\n\nExecute this task and return the result in JSON format with 'success', 'result', and 'metadata' fields.`;

    return prompt;
  }

  /**
   * Execute task with Claude
   */
  async executeWithClaude(prompt, task) {
    // This would integrate with Claude's API
    // For now, simulate execution
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return {
      success: true,
      result: `Claude executed task: ${task.task}`,
      metadata: {
        agent: 'claude',
        executionTime: Date.now(),
        tokensUsed: this.estimateTokenUsage(task)
      }
    };
  }

  /**
   * Execute task with GPT
   */
  async executeWithGPT(agent, prompt, task) {
    // This would integrate with OpenAI's API
    // For now, simulate execution
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    return {
      success: true,
      result: `${agent.name} executed task: ${task.task}`,
      metadata: {
        agent: agent.name,
        model: agent.model,
        executionTime: Date.now(),
        tokensUsed: this.estimateTokenUsage(task)
      }
    };
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentName = null) {
    if (agentName) {
      return this.agents[agentName] || null;
    }
    return this.agents;
  }

  /**
   * Update agent availability
   */
  async updateAgentStatus(agentName, status) {
    if (this.agents[agentName]) {
      this.agents[agentName].status = status;
      logger.debug(`[MaxEvo Agent Router] ${agentName} status: ${status}`);
    }
  }

  /**
   * Get routing statistics
   */
  getRoutingStats() {
    const stats = {};
    for (const [name, agent] of Object.entries(this.agents)) {
      stats[name] = {
        status: agent.status,
        completedTasks: agent.completedTasks || 0,
        costPerToken: agent.costPerToken,
        strengths: agent.strengths
      };
    }
    return stats;
  }
}

module.exports = MaxEvoAgentRouter;