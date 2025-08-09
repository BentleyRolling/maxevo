const axios = require('axios')

/**
 * WebSearchService - Handles web search and scraping functionality
 * Integrates Serper API for search and Firecrawl API for content scraping
 */
class WebSearchService {
  constructor() {
    this.serperApiKey = process.env.SERPER_API_KEY
    this.firecrawlApiKey = process.env.FIRECRAWL_API_KEY
    this.searchEnabled = process.env.SEARCH === 'true'
    
    console.log('🔍 WebSearchService initializing...')
    console.log('🔍 Search enabled:', this.searchEnabled)
    console.log('🔍 Serper API key:', !!this.serperApiKey)
    console.log('🔍 Firecrawl API key:', !!this.firecrawlApiKey)
  }

  /**
   * Check if web search is available
   */
  isAvailable() {
    return this.searchEnabled && !!this.serperApiKey
  }

  /**
   * Check if web scraping is available
   */
  isScrapingAvailable() {
    return !!this.firecrawlApiKey
  }

  /**
   * Perform web search using Serper API
   */
  async search(query, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Web search is not available - missing API key or disabled')
    }

    try {
      console.log(`🔍 Searching web for: "${query}"`)
      
      const response = await axios.post('https://google.serper.dev/search', {
        q: query,
        num: options.num || 10,
        hl: options.language || 'en',
        gl: options.country || 'us'
      }, {
        headers: {
          'X-API-KEY': this.serperApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })

      const results = response.data
      console.log(`✅ Found ${results.organic?.length || 0} search results`)

      return {
        query,
        results: results.organic || [],
        answerBox: results.answerBox,
        knowledgeGraph: results.knowledgeGraph,
        searchInformation: results.searchInformation
      }

    } catch (error) {
      console.error('❌ Web search failed:', error.message)
      throw new Error(`Web search failed: ${error.message}`)
    }
  }

  /**
   * Scrape content from a URL using Firecrawl API
   */
  async scrapeUrl(url, options = {}) {
    if (!this.isScrapingAvailable()) {
      throw new Error('Web scraping is not available - missing Firecrawl API key')
    }

    try {
      console.log(`🕷️ Scraping content from: ${url}`)
      
      const response = await axios.post('https://api.firecrawl.dev/v0/scrape', {
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: options.onlyMainContent !== false,
        includeTags: options.includeTags || ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'article'],
        excludeTags: options.excludeTags || ['nav', 'footer', 'aside', 'script', 'style'],
        timeout: options.timeout || 30000
      }, {
        headers: {
          'Authorization': `Bearer ${this.firecrawlApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 35000
      })

      const result = response.data
      console.log(`✅ Successfully scraped content from ${url}`)

      return {
        url,
        title: result.data?.metadata?.title || 'No title',
        content: result.data?.markdown || result.data?.html || 'No content extracted',
        metadata: result.data?.metadata || {},
        success: result.success
      }

    } catch (error) {
      console.error(`❌ Web scraping failed for ${url}:`, error.message)
      throw new Error(`Web scraping failed: ${error.message}`)
    }
  }

  /**
   * Search and scrape - combines search with content extraction
   */
  async searchAndScrape(query, options = {}) {
    const maxResults = options.maxResults || 3
    const maxContentLength = options.maxContentLength || 5000

    try {
      // First, perform the search
      const searchResults = await this.search(query, { num: maxResults + 2 })
      
      if (!searchResults.results || searchResults.results.length === 0) {
        return {
          query,
          results: [],
          summary: 'No search results found'
        }
      }

      // Then scrape content from top results
      const scrapedResults = []
      const urlsToScrape = searchResults.results
        .slice(0, maxResults)
        .map(result => result.link)
        .filter(url => url && !url.includes('youtube.com') && !url.includes('pdf'))

      console.log(`🕷️ Scraping ${urlsToScrape.length} URLs for detailed content`)

      for (const url of urlsToScrape) {
        try {
          const scraped = await this.scrapeUrl(url, { timeout: 20000 })
          if (scraped.success && scraped.content) {
            // Truncate content if too long
            let content = scraped.content
            if (content.length > maxContentLength) {
              content = content.substring(0, maxContentLength) + '...'
            }
            
            scrapedResults.push({
              ...scraped,
              content,
              searchRank: scrapedResults.length + 1
            })
          }
        } catch (scrapeError) {
          console.warn(`⚠️ Failed to scrape ${url}:`, scrapeError.message)
          // Continue with other URLs
        }
      }

      return {
        query,
        searchResults: searchResults.results.slice(0, maxResults),
        scrapedContent: scrapedResults,
        answerBox: searchResults.answerBox,
        knowledgeGraph: searchResults.knowledgeGraph,
        summary: `Found ${searchResults.results.length} search results, scraped ${scrapedResults.length} pages for detailed content`
      }

    } catch (error) {
      console.error('❌ Search and scrape failed:', error.message)
      throw error
    }
  }

  /**
   * Determine if a query needs web search
   */
  needsWebSearch(query) {
    const webSearchIndicators = [
      'latest', 'recent', 'current', 'today', 'now', 'update',
      'news', 'weather', 'stock', 'price', 'what happened',
      'when did', 'who is', 'where is', 'how to', 'what is',
      '2024', '2025', 'this year', 'this month', 'this week'
    ]

    const lowerQuery = query.toLowerCase()
    return webSearchIndicators.some(indicator => lowerQuery.includes(indicator))
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      searchEnabled: this.searchEnabled,
      searchAvailable: this.isAvailable(),
      scrapingAvailable: this.isScrapingAvailable(),
      apis: {
        serper: !!this.serperApiKey,
        firecrawl: !!this.firecrawlApiKey
      }
    }
  }
}

module.exports = WebSearchService