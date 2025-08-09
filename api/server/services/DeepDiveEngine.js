const QuestionAnalyzer = require('./QuestionAnalyzer')
const MarkdownValidator = require('./MarkdownValidator')

/**
 * Deep Dive Engine - Universal Answer Formatter
 * Ensures every MaxEvo response matches GPT-5 quality standards
 */
class DeepDiveEngine {
  constructor(webSearchService) {
    this.questionAnalyzer = new QuestionAnalyzer()
    this.markdownValidator = new MarkdownValidator()
    this.webSearchService = webSearchService
    this.maxRetries = 2
  }

  /**
   * Process question through complete deep-dive pipeline
   */
  async processQuestion(question, context = []) {
    console.log('🔍 Deep Dive Engine: Processing question...')
    
    // Step 1: Analyze question type
    const analysis = this.questionAnalyzer.analyzeQuestion(question)
    console.log(`📊 Question type: ${analysis.type} (confidence: ${(analysis.confidence * 100).toFixed(0)}%)`)

    // Step 2: Enhance with web search if needed
    let webSearchResults = null
    if (analysis.needsWebSearch && this.webSearchService?.isAvailable()) {
      console.log('🌐 Gathering fresh data via web search...')
      try {
        webSearchResults = await this.gatherWebData(question, analysis.type)
        console.log(`✅ Web search completed: ${webSearchResults?.summary || 'No results'}`)
      } catch (error) {
        console.warn('⚠️ Web search failed, proceeding without fresh data:', error.message)
      }
    }

    // Step 3: Build enhanced task with formatting specs
    const enhancedTask = this.buildEnhancedTask(question, analysis, webSearchResults, context)

    return {
      analysis,
      enhancedTask,
      webSearchResults,
      formattingSpec: this.questionAnalyzer.getFormattingSpec(analysis.type, !!webSearchResults)
    }
  }

  /**
   * Validate and potentially rewrite response
   */
  async validateAndEnhanceResponse(response, originalTask, llmExecutor) {
    console.log('🔍 Validating response structure...')
    
    let currentResponse = response
    let attempts = 0

    while (attempts < this.maxRetries) {
      const validation = this.markdownValidator.validateMarkdown(currentResponse)
      
      console.log(`📊 Validation score: ${validation.score}/100`)
      
      if (validation.isValid || validation.score > 75) {
        console.log('✅ Response meets quality standards')
        return {
          response: this.markdownValidator.autoFix(currentResponse),
          validation,
          rewriteAttempts: attempts
        }
      }

      console.log(`❌ Response needs improvement (attempt ${attempts + 1}/${this.maxRetries})`)
      console.log('Issues:', validation.issues.slice(0, 3))

      // Generate rewrite prompt
      const rewritePrompt = this.markdownValidator.generateRewritePrompt(currentResponse, validation)
      if (!rewritePrompt) break

      try {
        // Send back to LLM for rewriting
        const rewriteTask = {
          ...originalTask,
          content: `${originalTask.content}\n\nPrevious response:\n${currentResponse}\n\n${rewritePrompt}`
        }

        const rewriteResult = await llmExecutor(rewriteTask)
        currentResponse = rewriteResult.response

        attempts++
      } catch (error) {
        console.error('❌ Rewrite attempt failed:', error.message)
        break
      }
    }

    console.log(`⚠️ Final response after ${attempts} rewrite attempts`)
    return {
      response: this.markdownValidator.autoFix(currentResponse),
      validation: this.markdownValidator.validateMarkdown(currentResponse),
      rewriteAttempts: attempts
    }
  }

  /**
   * Gather web data based on question type
   */
  async gatherWebData(question, questionType) {
    const queries = this.generateSearchQueries(question, questionType)
    console.log('🔍 Search queries:', queries.slice(0, 3))

    try {
      // Use the first query for main search, others as fallbacks
      const mainQuery = queries[0]
      const result = await this.webSearchService.searchAndScrape(mainQuery, {
        maxResults: questionType === 'RANKING' ? 5 : 3,
        maxContentLength: 3000
      })

      // For rankings, try additional queries for more comprehensive data
      if (questionType === 'RANKING' && queries.length > 1) {
        try {
          const additionalQuery = queries[1]
          const additionalResult = await this.webSearchService.search(additionalQuery, { num: 3 })
          
          // Merge results
          if (additionalResult.results) {
            result.additionalSources = additionalResult.results
          }
        } catch (error) {
          console.warn('Additional search query failed:', error.message)
        }
      }

      return result
    } catch (error) {
      console.error('Web data gathering failed:', error.message)
      throw error
    }
  }

  /**
   * Generate multiple search queries based on question type
   */
  generateSearchQueries(question, questionType) {
    const baseQuery = question
    const queries = [baseQuery]

    switch (questionType) {
      case 'RANKING':
        // Add specific ranking variations
        if (question.includes('headphones')) {
          queries.push(`best headphones 2025 review comparison`)
          queries.push(`headphones ranking expert review`)
        } else if (question.includes('laptop')) {
          queries.push(`best laptop 2025 buying guide`)
          queries.push(`laptop comparison review 2025`)
        } else {
          queries.push(`${question} 2025 review`)
          queries.push(`${question} comparison guide`)
        }
        break
      
      case 'ANALYSIS':
        queries.push(`${question} latest news 2025`)
        queries.push(`${question} current trends analysis`)
        break
      
      case 'COMPARISON':
        queries.push(`${question} detailed comparison 2025`)
        queries.push(`${question} pros cons review`)
        break
      
      case 'HOW_TO':
        queries.push(`${question} complete guide 2025`)
        queries.push(`${question} step by step tutorial`)
        break

      default:
        queries.push(`${question} comprehensive guide`)
        break
    }

    return queries.slice(0, 3) // Limit to 3 queries
  }

  /**
   * Build enhanced task with all context and formatting
   */
  buildEnhancedTask(question, analysis, webSearchResults, context) {
    const task = {
      id: `deepdive_${Date.now()}`,
      type: 'chat',
      content: question,
      context: context,
      taskType: analysis.type,
      confidence: analysis.confidence,
      webSearchResults: webSearchResults,
      deepDiveEnabled: true,
      formattingInstructions: this.questionAnalyzer.getFormattingSpec(analysis.type, !!webSearchResults)
    }

    // Add type-specific enhancements
    if (webSearchResults) {
      task.content = this.enhanceQuestionWithWebResults(question, webSearchResults, analysis.type)
    }

    return task
  }

  /**
   * Enhance question with web search context
   */
  enhanceQuestionWithWebResults(question, webResults, questionType) {
    let enhanced = question

    if (webResults.scrapedContent && webResults.scrapedContent.length > 0) {
      enhanced += `\n\n--- CURRENT WEB DATA (${new Date().getFullYear()}) ---\n`
      
      if (questionType === 'RANKING' && webResults.scrapedContent.length > 2) {
        enhanced += `Based on current reviews and expert analysis:\n\n`
      } else {
        enhanced += `Recent information:\n\n`
      }

      // Add scraped content with source attribution
      webResults.scrapedContent.forEach((content, index) => {
        enhanced += `[Source ${index + 1}] ${content.title}\n`
        enhanced += `${content.content.substring(0, 800)}...\n`
        enhanced += `URL: ${content.url}\n\n`
      })

      enhanced += `--- END WEB DATA ---\n\n`
    }

    // Add answer box if available
    if (webResults.answerBox) {
      enhanced += `\nDirect Answer: ${webResults.answerBox.answer}\n\n`
    }

    enhanced += `Please provide a comprehensive, well-structured answer using the current information above.`

    return enhanced
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      totalProcessed: this.totalProcessed || 0,
      typeBreakdown: this.typeStats || {},
      avgQualityScore: this.avgQualityScore || 0,
      webSearchUsage: this.webSearchUsage || 0
    }
  }
}

module.exports = DeepDiveEngine