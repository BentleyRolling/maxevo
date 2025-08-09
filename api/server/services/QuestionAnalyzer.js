/**
 * Question Type Detection and Analysis Service
 * Classifies user queries to apply appropriate deep-dive formatting
 */
class QuestionAnalyzer {
  constructor() {
    this.patterns = {
      RANKING: [
        /\b(best|top|greatest|highest|worst|lowest|ranked?|rating|review|recommend)\b/i,
        /\b(vs\.?|versus|compare|comparison|better than)\b/i,
        /\b(list of|top \d+|\d+ best|best \d+)\b/i,
        /\b(headphones|laptop|phone|car|camera|under \$?\d+)\b/i
      ],
      HOW_TO: [
        /\b(how to|how do|step by step|guide|tutorial|instructions)\b/i,
        /\b(setup|install|configure|implement|create|build|make)\b/i,
        /\b(process|procedure|method|way to)\b/i,
        /^(set up|fix|solve|resolve|debug)\b/i
      ],
      TECHNICAL: [
        /\b(error|bug|debug|fix|troubleshoot|not working|broken)\b/i,
        /\b(code|programming|function|class|variable|syntax)\b/i,
        /\b(javascript|python|react|node|api|database|sql)\b/i,
        /\b(deployment|server|hosting|cors|authentication)\b/i
      ],
      ANALYSIS: [
        /\b(explain|analysis|analyze|why|what|understand|meaning)\b/i,
        /\b(trend|market|industry|economic|political|social)\b/i,
        /\b(history|background|context|overview|summary)\b/i,
        /\b(impact|effect|consequence|result|outcome)\b/i
      ],
      COMPARISON: [
        /\b(vs\.?|versus|compare|comparison|difference|similar|unlike)\b/i,
        /\b(better|worse|pros and cons|advantages|disadvantages)\b/i,
        /\b(which one|should I choose|or)\b/i,
        /\b(between|against|alternatives)\b/i
      ],
      STRATEGY: [
        /\b(strategy|plan|planning|roadmap|approach|tactics)\b/i,
        /\b(business|marketing|growth|launch|startup|scale)\b/i,
        /\b(goals|objectives|milestones|timeline|phases)\b/i,
        /\b(budget|cost|roi|revenue|profit)\b/i
      ],
      CREATIVE: [
        /\b(write|story|script|poem|creative|brainstorm|ideas)\b/i,
        /\b(character|plot|narrative|dialogue|scene)\b/i,
        /\b(blog post|article|content|copy|marketing)\b/i,
        /\b(generate|create|design|imagine)\b/i
      ]
    }
  }

  /**
   * Analyze question and determine type
   */
  analyzeQuestion(question) {
    if (!question || typeof question !== 'string') {
      return { type: 'OTHER', confidence: 0 }
    }

    const lowerQuestion = question.toLowerCase()
    const scores = {}

    // Calculate confidence scores for each type
    for (const [type, patterns] of Object.entries(this.patterns)) {
      let score = 0
      for (const pattern of patterns) {
        if (pattern.test(lowerQuestion)) {
          score += 1
        }
      }
      scores[type] = score
    }

    // Find the highest scoring type
    const maxScore = Math.max(...Object.values(scores))
    const detectedType = Object.keys(scores).find(type => scores[type] === maxScore)

    // Return OTHER if no patterns matched
    if (maxScore === 0) {
      return { type: 'OTHER', confidence: 0 }
    }

    return {
      type: detectedType,
      confidence: maxScore / this.patterns[detectedType].length,
      allScores: scores,
      needsWebSearch: this.needsWebSearch(question, detectedType)
    }
  }

  /**
   * Determine if question needs web search
   */
  needsWebSearch(question, type) {
    const webSearchIndicators = [
      /\b(2024|2025|latest|recent|current|today|now|this year)\b/i,
      /\b(news|price|stock|weather|trending)\b/i,
      /\b(best.*2024|best.*2025|top.*2024|top.*2025)\b/i,
      /\b(review|rating|comparison|vs)\b/i
    ]

    // Rankings and comparisons usually benefit from fresh data
    if (['RANKING', 'COMPARISON', 'ANALYSIS'].includes(type)) {
      return true
    }

    // Check for explicit indicators
    return webSearchIndicators.some(pattern => pattern.test(question))
  }

  /**
   * Generate formatting instructions based on question type
   */
  getFormattingSpec(type, hasWebSearch = false) {
    const baseRules = `
**UNIVERSAL FORMATTING RULES:**
- Output in valid GitHub-Flavored Markdown
- Use ## for main sections, ### for subsections
- **Bold** for key terms, product names, important points
- Bullet points for lists, numbered lists for steps/rankings
- > blockquotes for key takeaways
- Tables for comparisons when appropriate
- Double line breaks between major sections
- Keep paragraphs short (2-4 sentences max)
- Add relevant emoji to headings where helpful`

    const typeSpecific = {
      RANKING: `
**RANKING/REVIEW FORMAT:**
- Start with ## Main Title 🏆
- For each ranked item:
  ### N) **Product/Item Name** - Price/Key Detail
  - **Why it's here:** Brief explanation
  - **Pros:** Key advantages
  - **Cons:** Notable limitations
  - **Key specs:** Important details
- End with comparison table if helpful
- Include > **Takeaway:** summary${hasWebSearch ? '\n- Cite sources with links' : ''}`,

      HOW_TO: `
**HOW-TO/GUIDE FORMAT:**
- ## Main Title 📋
- Brief overview paragraph
- ### Prerequisites (if any)
- ### Step-by-Step Instructions
  1. **Step 1:** Clear action with 1-2 sentence explanation
     - Sub-bullets for tips/warnings
  2. **Step 2:** Continue pattern...
- ### Common Issues & Solutions
- > **Key Takeaway:** Summary of success factors`,

      TECHNICAL: `
**TECHNICAL DEBUG FORMAT:**
- ## Problem Summary 🔧
- ### Root Cause Analysis
- ### Solution Steps
  1. **Immediate fix:** Quick resolution
  2. **Detailed implementation:** Code examples
  3. **Testing:** Verification steps
- ### Final Code Example
\`\`\`language
// Working code here
\`\`\`
- ### Common Pitfalls to Avoid`,

      ANALYSIS: `
**ANALYSIS/EXPLAINER FORMAT:**
- ## Main Topic Overview 📊
- ### Key Factors/Timeline
- ### Causes & Contributing Elements
- ### Current Impact & Effects
- ### Future Implications
- > **Bottom Line:** Clear summary of main insights${hasWebSearch ? '\n- Include recent data and sources' : ''}`,

      COMPARISON: `
**COMPARISON FORMAT:**
- ## Comparison Overview ⚖️
- ### Quick Comparison Table
| Feature | Option A | Option B |
|---------|----------|----------|
- ### Detailed Analysis
  - **Option A:** Strengths and use cases
  - **Option B:** Strengths and use cases
- ### Which to Choose
- > **Recommendation:** Based on specific needs`,

      STRATEGY: `
**STRATEGY/PLAN FORMAT:**
- ## Strategy Overview 🎯
- ### Phase 1: Foundation
  - Specific actions and milestones
- ### Phase 2: Implementation  
  - Measurable outcomes
- ### Phase 3: Optimization
  - Success metrics
- ### Budget & Timeline
- > **Success Metrics:** How to measure progress`,

      CREATIVE: `
**CREATIVE FORMAT:**
- ## Creative Brief ✨
- ### Concept Overview
- ### Key Elements/Structure
  - Scene/section headings
  - Bullet points for ideas
- ### Implementation Details
- > **Creative Direction:** Core theme/message`,

      OTHER: `
**STRUCTURED ANSWER FORMAT:**
- ## Main Topic
- ### Key Points
  - Bullet points for main ideas
  - Clear, concise explanations
- ### Supporting Details
- > **Summary:** Key takeaways`
    }

    return baseRules + '\n' + (typeSpecific[type] || typeSpecific.OTHER)
  }
}

module.exports = QuestionAnalyzer