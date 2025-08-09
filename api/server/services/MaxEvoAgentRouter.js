const OpenAI = require('openai')
const Anthropic = require('@anthropic-ai/sdk')
const WebSearchService = require('./WebSearchService')

/**
 * MaxEvoAgentRouter - Intelligent routing system for AI agents
 * Routes tasks to the most appropriate AI agent based on task type and requirements
 */
class MaxEvoAgentRouter {
  constructor(core, config = {}) {
    this.core = core
    this.config = {
      defaultAgent: 'gpt-4',
      timeout: 30000,
      maxRetries: 3,
      ...config
    }
    
    this.agents = new Map()
    this.routingRules = new Map()
    this.webSearchService = new WebSearchService()
    this.stats = {
      totalRequests: 0,
      successfulRoutes: 0,
      failedRoutes: 0,
      agentUsage: {},
      webSearches: 0
    }
    
    this.initialized = false
  }

  /**
   * Initialize the agent router
   */
  async initialize() {
    try {
      console.log('🎯 Initializing MaxEvo Agent Router...')
      
      // Initialize AI clients
      await this.initializeAIClients()
      
      // Setup routing rules
      this.setupRoutingRules()
      
      // Register with core
      if (this.core) {
        this.core.registerService('agentRouter', this)
      }
      
      this.initialized = true
      console.log('✅ MaxEvo Agent Router initialized')
      
    } catch (error) {
      console.error('❌ Agent Router initialization failed:', error)
      throw error
    }
  }

  /**
   * Initialize AI service clients
   */
  async initializeAIClients() {
    console.log('🔍 DEBUG: Checking environment variables...')
    console.log('🔍 DEBUG: OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY, 'len:', process.env.OPENAI_API_KEY?.length)
    console.log('🔍 DEBUG: ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY, 'len:', process.env.ANTHROPIC_API_KEY?.length)
    console.log('🔍 DEBUG: NODE_ENV:', process.env.NODE_ENV)
    
    // OpenAI client with timeout
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log('🔍 DEBUG: Creating OpenAI client...')
        const openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        })
        console.log('🔍 DEBUG: OpenAI client object created, testing with fast probe...')
        
        // Quick validation with minimal completion
        const probePromise = openaiClient.chat.completions.create({
          model: process.env.OPENAI_FAST_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'pong' }],
          max_tokens: 1
        })
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI probe timeout after 2s')), 2000)
        )
        
        await Promise.race([probePromise, timeoutPromise])
        
        this.agents.set('openai', openaiClient)
        console.log('✅ OpenAI client initialized and tested successfully')
      } catch (error) {
        console.error('❌ OpenAI client initialization/test failed:', error.message)
        console.error('❌ Error details:', error)
        // Don't throw - continue with other clients
      }
    } else {
      console.log('⚠️ No OPENAI_API_KEY found')
    }
    
    // Anthropic (Claude) client with timeout
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        console.log('🔍 DEBUG: Creating Anthropic client...')
        const anthropicClient = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          timeout: 10000 // 10 second timeout
        })
        console.log('🔍 DEBUG: Anthropic client object created')
        
        this.agents.set('anthropic', anthropicClient)
        console.log('✅ Anthropic (Claude) client initialized successfully')
      } catch (error) {
        console.error('❌ Anthropic client initialization failed:', error.message)
        console.error('❌ Error details:', error)
        // Don't throw - continue
      }
    } else {
      console.log('⚠️ No ANTHROPIC_API_KEY found')
    }
    
    console.log(`🔍 DEBUG: Total agents initialized: ${this.agents.size}`)
    
    if (this.agents.size === 0) {
      const error = new Error('No AI service API keys configured or all clients failed to initialize')
      error.code = 'MISSING_API_KEYS'
      console.error('❌ No AI service API keys found - system cannot function')
      throw error
    }
  }

  /**
   * Setup intelligent routing rules
   */
  setupRoutingRules() {
    // Claude is better for analysis, reasoning, and complex tasks
    this.routingRules.set('analysis', {
      preferredAgent: 'claude-3-sonnet',
      fallback: 'gpt-4',
      reason: 'Claude excels at analytical reasoning'
    })
    
    this.routingRules.set('reasoning', {
      preferredAgent: 'claude-3-sonnet',
      fallback: 'gpt-4',
      reason: 'Claude has superior reasoning capabilities'
    })
    
    this.routingRules.set('writing', {
      preferredAgent: 'claude-3-sonnet',
      fallback: 'gpt-4',
      reason: 'Claude produces high-quality written content'
    })
    
    // GPT-4 is good for general tasks and coding
    this.routingRules.set('coding', {
      preferredAgent: 'gpt-4',
      fallback: 'claude-3-sonnet',
      reason: 'GPT-4 has strong coding capabilities'
    })
    
    this.routingRules.set('general', {
      preferredAgent: 'gpt-4',
      fallback: 'claude-3-sonnet',
      reason: 'GPT-4 handles general tasks well'
    })
    
    console.log('📋 Routing rules configured')
  }

  /**
   * Route a task to the most appropriate agent
   */
  async routeTask(task) {
    try {
      this.stats.totalRequests++
      
      // Check if task needs web search
      const needsWebSearch = this.webSearchService.needsWebSearch(task.content)
      let webSearchResults = null
      
      if (needsWebSearch && this.webSearchService.isAvailable()) {
        console.log(`🌐 Task requires web search: "${task.content}"`)
        try {
          webSearchResults = await this.webSearchService.searchAndScrape(task.content, {
            maxResults: 3,
            maxContentLength: 3000
          })
          this.stats.webSearches++
          console.log(`✅ Web search completed: ${webSearchResults.summary}`)
        } catch (webError) {
          console.warn('⚠️ Web search failed, proceeding without:', webError.message)
        }
      }
      
      // Enhance task with web search results if available
      if (webSearchResults) {
        task.webSearchResults = webSearchResults
        task.content = this.enhancePromptWithWebResults(task.content, webSearchResults)
      }
      
      // Determine the best agent for this task
      const agentChoice = this.selectAgent(task)
      const agent = agentChoice.agent
      const model = agentChoice.model
      
      console.log(`🎯 Routing task ${task.id} to ${agent} (${model})`)
      console.log(`🔍 Debug - agent: "${agent}", this.agents.has('openai'): ${this.agents.has('openai')}`)
      console.log(`🔍 Debug - Available agents: [${Array.from(this.agents.keys()).join(', ')}]`)
      
      // Execute the task with the selected agent
      let result
      if (agent === 'anthropic' && this.agents.has('anthropic')) {
        console.log(`✅ Using Anthropic/Claude`)
        result = await this.executeWithClaude(task, model)
      } else if (agent === 'openai' && this.agents.has('openai')) {
        console.log(`✅ Using OpenAI/GPT`)
        result = await this.executeWithOpenAI(task, model)
      } else {
        // This should not happen if selectAgent works correctly
        const error = new Error(`Selected agent "${agent}" is not available`)
        error.code = 'AGENT_UNAVAILABLE'
        throw error
      }
      
      // Add web search info to result
      if (webSearchResults) {
        result.webSearchUsed = true
        result.webSearchSummary = webSearchResults.summary
      }
      
      // Update stats
      this.stats.successfulRoutes++
      this.stats.agentUsage[agent] = (this.stats.agentUsage[agent] || 0) + 1
      
      return {
        ...result,
        agent: agent,
        model: model,
        taskId: task.id,
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      this.stats.failedRoutes++
      console.error(`❌ Task routing failed for ${task.id}:`, error)
      
      // Properly throw error instead of masking it
      const routingError = new Error('Agent routing failed')
      routingError.cause = error
      routingError.code = 'PROVIDER_FAILURE'
      routingError.taskId = task.id
      throw routingError
    }
  }

  /**
   * Select the best agent for a task
   */
  selectAgent(task) {
    const taskType = this.categorizeTask(task)
    const rule = this.routingRules.get(taskType) || this.routingRules.get('general')
    
    // Check if preferred agent is available
    const preferredAgent = rule.preferredAgent
    if (preferredAgent.includes('claude') && this.agents.has('anthropic')) {
      return { agent: 'anthropic', model: preferredAgent }
    } else if (preferredAgent.includes('gpt') && this.agents.has('openai')) {
      return { agent: 'openai', model: preferredAgent }
    }
    
    // Try fallback
    const fallbackAgent = rule.fallback
    if (fallbackAgent.includes('claude') && this.agents.has('anthropic')) {
      return { agent: 'anthropic', model: fallbackAgent }
    } else if (fallbackAgent.includes('gpt') && this.agents.has('openai')) {
      return { agent: 'openai', model: fallbackAgent }
    }
    
    // Default fallback
    if (this.agents.has('anthropic')) {
      return { agent: 'anthropic', model: 'claude-3-sonnet-20240229' }
    } else if (this.agents.has('openai')) {
      return { agent: 'openai', model: 'gpt-4' }
    }
    
    // No agents available - throw error
    const error = new Error('No AI agents available for task routing')
    error.code = 'NO_AGENTS_AVAILABLE'
    throw error
  }

  /**
   * Categorize task to determine routing
   */
  categorizeTask(task) {
    const content = task.content?.toLowerCase() || ''
    
    // Analysis keywords
    if (content.includes('analyze') || content.includes('analysis') || 
        content.includes('examine') || content.includes('review') ||
        content.includes('evaluate') || content.includes('assess')) {
      return 'analysis'
    }
    
    // Writing keywords
    if (content.includes('write') || content.includes('blog') || 
        content.includes('article') || content.includes('content') ||
        content.includes('copy') || content.includes('draft')) {
      return 'writing'
    }
    
    // Coding keywords
    if (content.includes('code') || content.includes('program') || 
        content.includes('function') || content.includes('api') ||
        content.includes('debug') || content.includes('script')) {
      return 'coding'
    }
    
    // Reasoning keywords
    if (content.includes('explain') || content.includes('how') || 
        content.includes('why') || content.includes('reason') ||
        content.includes('logic') || content.includes('think')) {
      return 'reasoning'
    }
    
    return 'general'
  }

  /**
   * Execute task with Claude (Anthropic)
   */
  async executeWithClaude(task, model) {
    const anthropic = this.agents.get('anthropic')
    
    const systemPrompt = this.getSystemPromptForClaude(task)
    const userPrompt = this.formatPromptForClaude(task)
    
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })
    
    return {
      response: response.content[0].text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    }
  }

  /**
   * Execute task with OpenAI GPT
   */
  async executeWithOpenAI(task, model) {
    const openai = this.agents.get('openai')
    
    const systemPrompt = this.getSystemPromptForOpenAI(task)
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: this.formatPromptForOpenAI(task)
        }
      ],
      max_tokens: 4096
    })
    
    return {
      response: response.choices[0].message.content,
      usage: {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens
      }
    }
  }

  /**
   * Execute mock response when no agents available
   */
  async executeMockResponse(task, agent) {
    console.log(`🎭 Generating mock response for agent: ${agent}`)
    
    const responses = [
      `I understand your request about "${task.content}". In a fully deployed MaxEvo system, I would coordinate with multiple AI agents to provide the best response.`,
      `Your request has been analyzed and would normally be distributed to specialized agents. This demo shows the MaxEvo orchestration interface working.`,
      `I'm ready to help with complex tasks involving multiple agents, automation, and intelligent routing. This is a demonstration of the MaxEvo UI system.`
    ]
    
    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      usage: { inputTokens: 50, outputTokens: 100 }
    }
  }

  /**
   * Format prompt for Claude
   */
  formatPromptForClaude(task) {
    let prompt = task.content
    
    if (task.context && task.context.length > 0) {
      prompt = `Context from recent conversation:\n${task.context.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nCurrent request: ${task.content}`
    }
    
    return prompt
  }

  /**
   * Format prompt for OpenAI
   */
  formatPromptForOpenAI(task) {
    return this.formatPromptForClaude(task) // Same format for now
  }

  /**
   * Get router statistics
   */
  getStats() {
    return {
      ...this.stats,
      availableAgents: Array.from(this.agents.keys()),
      routingRules: Object.fromEntries(this.routingRules)
    }
  }

  /**
   * Enhance prompt with web search results
   */
  enhancePromptWithWebResults(originalPrompt, webResults) {
    if (!webResults || !webResults.scrapedContent || webResults.scrapedContent.length === 0) {
      return originalPrompt
    }

    let enhancement = `\n\n--- CURRENT WEB SEARCH RESULTS ---\n`
    enhancement += `Query: "${webResults.query}"\n\n`

    // Add answer box if available
    if (webResults.answerBox) {
      enhancement += `Direct Answer: ${webResults.answerBox.answer}\n\n`
    }

    // Add scraped content
    webResults.scrapedContent.forEach((content, index) => {
      enhancement += `[${index + 1}] ${content.title}\n`
      enhancement += `URL: ${content.url}\n`
      enhancement += `Content: ${content.content.substring(0, 1000)}...\n\n`
    })

    enhancement += `--- END WEB SEARCH RESULTS ---\n\n`
    enhancement += `Original question: ${originalPrompt}`

    return enhancement
  }

  /**
   * Get system prompt for OpenAI with capabilities
   */
  getSystemPromptForOpenAI(task) {
    let basePrompt = 'You are MaxEvo, an advanced AI orchestration assistant with real-time web access capabilities.'
    
    const capabilities = []
    if (this.webSearchService.isAvailable()) {
      capabilities.push('web search')
    }
    if (this.webSearchService.isScrapingAvailable()) {
      capabilities.push('web content scraping')
    }

    if (capabilities.length > 0) {
      basePrompt += ` You have access to: ${capabilities.join(', ')}.`
    }

    if (task.webSearchResults) {
      basePrompt += ' I have already searched the web for current information related to this query. Use this information along with your knowledge to provide the most accurate and up-to-date response.'
    }

    basePrompt += ' Provide helpful, accurate, and detailed responses. When you use web search results, cite your sources.'

    return basePrompt
  }

  /**
   * Get system prompt for Claude with capabilities
   */
  getSystemPromptForClaude(task) {
    return this.getSystemPromptForOpenAI(task) // Same for now
  }

  /**
   * Health check
   */
  isHealthy() {
    return this.initialized && this.agents.size > 0
  }

  /**
   * Get web search service status
   */
  getWebSearchStatus() {
    return this.webSearchService.getStatus()
  }
}

module.exports = MaxEvoAgentRouter