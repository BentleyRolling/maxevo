const fs = require('fs').promises
const path = require('path')

/**
 * MaxEvoMemoryCore - Persistent memory and state management system
 * Handles conversation history, system state, and resurrection protocols
 */
class MaxEvoMemoryCore {
  constructor(core, config = {}) {
    this.core = core
    this.config = {
      memoryPath: path.join(process.cwd(), 'data', 'memory'),
      maxConversationHistory: 1000,
      maxContextWindow: 10,
      autoSave: true,
      saveInterval: 30000, // 30 seconds
      ...config
    }
    
    this.memory = {
      conversations: new Map(),
      systemState: {},
      userProfiles: new Map(),
      taskHistory: [],
      metadata: {
        created: new Date(),
        lastSaved: null,
        version: '1.0.0'
      }
    }
    
    this.initialized = false
    this.saveInterval = null
  }

  /**
   * Initialize memory core
   */
  async initialize() {
    try {
      console.log('🧠 Initializing MaxEvo Memory Core...')
      
      // Ensure memory directory exists
      await this.ensureMemoryDirectory()
      
      // Load existing memory
      await this.loadMemory()
      
      // Setup auto-save
      if (this.config.autoSave) {
        this.setupAutoSave()
      }
      
      // Register with core
      if (this.core) {
        this.core.registerService('memoryCore', this)
      }
      
      this.initialized = true
      console.log('✅ MaxEvo Memory Core initialized')
      
    } catch (error) {
      console.error('❌ Memory Core initialization failed:', error)
      throw error
    }
  }

  /**
   * Store conversation message
   */
  storeConversation(chatId, message) {
    if (!this.memory.conversations.has(chatId)) {
      this.memory.conversations.set(chatId, {
        id: chatId,
        messages: [],
        created: new Date(),
        lastUpdated: new Date(),
        metadata: {}
      })
    }
    
    const conversation = this.memory.conversations.get(chatId)
    conversation.messages.push({
      ...message,
      timestamp: new Date(),
      id: message.id || Date.now().toString()
    })
    
    conversation.lastUpdated = new Date()
    
    // Limit conversation history
    if (conversation.messages.length > this.config.maxConversationHistory) {
      conversation.messages = conversation.messages.slice(-this.config.maxConversationHistory)
    }
    
    console.log(`💾 Stored message in conversation ${chatId}`)
  }

  /**
   * Get conversation history
   */
  getConversation(chatId, limit = null) {
    const conversation = this.memory.conversations.get(chatId)
    if (!conversation) {
      return null
    }
    
    let messages = conversation.messages
    if (limit) {
      messages = messages.slice(-limit)
    }
    
    return {
      ...conversation,
      messages
    }
  }

  /**
   * Get conversation context for AI
   */
  getConversationContext(chatId, contextWindow = null) {
    const windowSize = contextWindow || this.config.maxContextWindow
    const conversation = this.getConversation(chatId, windowSize)
    
    if (!conversation) {
      return []
    }
    
    return conversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    }))
  }

  /**
   * Store user profile information
   */
  storeUserProfile(userId, profile) {
    this.memory.userProfiles.set(userId, {
      ...profile,
      id: userId,
      updatedAt: new Date()
    })
    
    console.log(`👤 Stored user profile: ${userId}`)
  }

  /**
   * Get user profile
   */
  getUserProfile(userId) {
    return this.memory.userProfiles.get(userId)
  }

  /**
   * Store system state
   */
  storeSystemState(key, value) {
    this.memory.systemState[key] = {
      value,
      timestamp: new Date()
    }
    
    console.log(`⚙️ Stored system state: ${key}`)
  }

  /**
   * Get system state
   */
  getSystemState(key) {
    const state = this.memory.systemState[key]
    return state ? state.value : null
  }

  /**
   * Store task in history
   */
  storeTaskHistory(task) {
    this.memory.taskHistory.push({
      ...task,
      storedAt: new Date()
    })
    
    // Limit task history
    if (this.memory.taskHistory.length > 1000) {
      this.memory.taskHistory = this.memory.taskHistory.slice(-1000)
    }
    
    console.log(`📝 Stored task history: ${task.id}`)
  }

  /**
   * Get task history
   */
  getTaskHistory(limit = 100) {
    return this.memory.taskHistory.slice(-limit)
  }

  /**
   * Search conversations
   */
  searchConversations(query, limit = 10) {
    const results = []
    const searchTerm = query.toLowerCase()
    
    for (const [chatId, conversation] of this.memory.conversations.entries()) {
      const matchingMessages = conversation.messages.filter(msg => 
        msg.content.toLowerCase().includes(searchTerm)
      )
      
      if (matchingMessages.length > 0) {
        results.push({
          chatId,
          conversation: {
            ...conversation,
            messages: matchingMessages
          },
          relevance: matchingMessages.length
        })
      }
    }
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance)
    
    return results.slice(0, limit)
  }

  /**
   * Clear conversation
   */
  clearConversation(chatId) {
    if (this.memory.conversations.has(chatId)) {
      this.memory.conversations.delete(chatId)
      console.log(`🗑️ Cleared conversation: ${chatId}`)
      return true
    }
    return false
  }

  /**
   * Get memory statistics
   */
  getStats() {
    const totalMessages = Array.from(this.memory.conversations.values())
      .reduce((sum, conv) => sum + conv.messages.length, 0)
    
    return {
      conversations: this.memory.conversations.size,
      totalMessages,
      userProfiles: this.memory.userProfiles.size,
      taskHistory: this.memory.taskHistory.length,
      systemStateKeys: Object.keys(this.memory.systemState).length,
      memorySize: this.calculateMemorySize(),
      lastSaved: this.memory.metadata.lastSaved
    }
  }

  /**
   * Calculate approximate memory size
   */
  calculateMemorySize() {
    const jsonString = JSON.stringify({
      conversations: Array.from(this.memory.conversations.entries()),
      systemState: this.memory.systemState,
      userProfiles: Array.from(this.memory.userProfiles.entries()),
      taskHistory: this.memory.taskHistory
    })
    
    return jsonString.length
  }

  /**
   * Save memory to disk
   */
  async saveMemory() {
    try {
      const memoryData = {
        conversations: Array.from(this.memory.conversations.entries()),
        systemState: this.memory.systemState,
        userProfiles: Array.from(this.memory.userProfiles.entries()),
        taskHistory: this.memory.taskHistory,
        metadata: {
          ...this.memory.metadata,
          lastSaved: new Date()
        }
      }
      
      const filePath = path.join(this.config.memoryPath, 'memory.json')
      await fs.writeFile(filePath, JSON.stringify(memoryData, null, 2))
      
      this.memory.metadata.lastSaved = new Date()
      console.log('💾 Memory saved to disk')
      
    } catch (error) {
      console.error('❌ Failed to save memory:', error)
    }
  }

  /**
   * Load memory from disk
   */
  async loadMemory() {
    try {
      const filePath = path.join(this.config.memoryPath, 'memory.json')
      
      try {
        const data = await fs.readFile(filePath, 'utf8')
        const memoryData = JSON.parse(data)
        
        // Restore conversations
        this.memory.conversations = new Map(memoryData.conversations || [])
        
        // Restore system state
        this.memory.systemState = memoryData.systemState || {}
        
        // Restore user profiles
        this.memory.userProfiles = new Map(memoryData.userProfiles || [])
        
        // Restore task history
        this.memory.taskHistory = memoryData.taskHistory || []
        
        // Restore metadata
        this.memory.metadata = {
          ...this.memory.metadata,
          ...memoryData.metadata
        }
        
        console.log('📖 Memory loaded from disk')
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log('📝 No existing memory file found, starting fresh')
        } else {
          throw error
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to load memory:', error)
    }
  }

  /**
   * Setup auto-save functionality
   */
  setupAutoSave() {
    this.saveInterval = setInterval(async () => {
      await this.saveMemory()
    }, this.config.saveInterval)
    
    console.log(`🔄 Auto-save enabled (${this.config.saveInterval}ms interval)`)
  }

  /**
   * Ensure memory directory exists
   */
  async ensureMemoryDirectory() {
    try {
      await fs.access(this.config.memoryPath)
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(this.config.memoryPath, { recursive: true })
        console.log(`📁 Created memory directory: ${this.config.memoryPath}`)
      } else {
        throw error
      }
    }
  }

  /**
   * Health check
   */
  isHealthy() {
    return this.initialized
  }

  /**
   * Shutdown memory core
   */
  async shutdown() {
    console.log('🛑 Shutting down memory core...')
    
    // Clear auto-save interval
    if (this.saveInterval) {
      clearInterval(this.saveInterval)
    }
    
    // Save final state
    await this.saveMemory()
    
    console.log('✅ Memory core shutdown complete')
  }
}

module.exports = MaxEvoMemoryCore