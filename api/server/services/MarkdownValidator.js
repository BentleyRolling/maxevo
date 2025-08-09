/**
 * Markdown Validation and Structure Enforcement
 * Ensures all MaxEvo responses meet formatting standards
 */
class MarkdownValidator {
  constructor() {
    this.minRequirements = {
      hasHeadings: /(^|\n)#{2,3} /,
      hasLists: /(^|\n)[-*•] ||(^|\n)\d+\. /,
      hasBoldText: /\*\*[^*]+\*\*/,
      hasProperSpacing: /\n\n/,
      noGiantBlocks: true // Checked separately
    }
  }

  /**
   * Validate markdown structure and content
   */
  validateMarkdown(content) {
    if (!content || typeof content !== 'string') {
      return {
        isValid: false,
        issues: ['Content is empty or invalid'],
        suggestions: ['Provide valid markdown content']
      }
    }

    const issues = []
    const suggestions = []

    // Check for main headings
    if (!this.minRequirements.hasHeadings.test(content)) {
      issues.push('Missing main headings (## or ###)')
      suggestions.push('Add section headings using ## for main topics and ### for subtopics')
    }

    // Check for lists where appropriate
    const hasQuestionWords = /\b(what|how|why|when|where|which|best|top|list)\b/i.test(content)
    const hasListContent = /(steps?|points?|items?|factors?|reasons?|benefits?|features?)/i.test(content)
    
    if ((hasQuestionWords || hasListContent) && !this.minRequirements.hasLists.test(content)) {
      issues.push('Content suggests lists but none found')
      suggestions.push('Use bullet points (-) or numbered lists (1. 2. 3.) for better readability')
    }

    // Check for emphasis/bold text
    if (!this.minRequirements.hasBoldText.test(content)) {
      issues.push('No emphasis/bold text found')
      suggestions.push('Use **bold text** for important terms, product names, and key points')
    }

    // Check for proper spacing
    if (!this.minRequirements.hasProperSpacing.test(content)) {
      issues.push('Insufficient spacing between sections')
      suggestions.push('Add double line breaks (\\n\\n) between major sections')
    }

    // Check for giant text blocks
    const paragraphs = content.split('\n\n')
    const giantBlocks = paragraphs.filter(p => {
      const sentences = p.split(/[.!?]+/).filter(s => s.trim().length > 0)
      return sentences.length > 6 // More than 6 sentences in one paragraph
    })

    if (giantBlocks.length > 0) {
      issues.push('Text blocks are too large')
      suggestions.push('Break large paragraphs into smaller sections with headings and lists')
    }

    // Check for proper markdown syntax
    const syntaxIssues = this.checkMarkdownSyntax(content)
    issues.push(...syntaxIssues.issues)
    suggestions.push(...syntaxIssues.suggestions)

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
      score: this.calculateQualityScore(content, issues)
    }
  }

  /**
   * Check for markdown syntax issues
   */
  checkMarkdownSyntax(content) {
    const issues = []
    const suggestions = []

    // Check for unmatched bold/italic markers
    const boldMarkers = (content.match(/\*\*/g) || []).length
    if (boldMarkers % 2 !== 0) {
      issues.push('Unmatched bold markers (**)') 
      suggestions.push('Ensure all **bold text** has matching closing markers')
    }

    // Check for improper heading spacing
    const badHeadingSpacing = /#{1,6}[^\s]/g.test(content)
    if (badHeadingSpacing) {
      issues.push('Headings missing space after #')
      suggestions.push('Add space after # symbols: "## Heading" not "##Heading"')
    }

    // Check for mixed list styles in same section
    const sections = content.split(/\n#{2,3} /)
    for (const section of sections) {
      const hasBullets = /\n[-*•] /.test(section)
      const hasNumbers = /\n\d+\. /.test(section)
      if (hasBullets && hasNumbers) {
        issues.push('Mixed list styles in same section')
        suggestions.push('Use consistent list style within each section')
      }
    }

    return { issues, suggestions }
  }

  /**
   * Calculate content quality score (0-100)
   */
  calculateQualityScore(content, issues) {
    let score = 100

    // Deduct points for each issue type
    const deductions = {
      'Missing main headings': 25,
      'Content suggests lists but none found': 20,
      'No emphasis/bold text found': 15,
      'Insufficient spacing between sections': 15,
      'Text blocks are too large': 20,
      'Unmatched bold markers': 10,
      'Headings missing space after #': 5,
      'Mixed list styles': 5
    }

    for (const issue of issues) {
      const deduction = deductions[issue] || 10
      score -= deduction
    }

    // Bonus points for good structure
    const hasGoodStructure = this.hasGoodStructure(content)
    if (hasGoodStructure.score > 0) {
      score += hasGoodStructure.score
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Check for advanced structural elements
   */
  hasGoodStructure(content) {
    let bonusScore = 0
    const features = []

    // Check for blockquotes (takeaways)
    if (/^>\s*\*\*[^*]+\*\*:/m.test(content)) {
      bonusScore += 10
      features.push('Proper takeaway blockquotes')
    }

    // Check for tables
    if (/\|.*\|/.test(content) && /\|[-:]+\|/.test(content)) {
      bonusScore += 15
      features.push('Well-formatted tables')
    }

    // Check for code blocks
    if (/```\w+\n[\s\S]*?\n```/.test(content)) {
      bonusScore += 10
      features.push('Proper code blocks with language specification')
    }

    // Check for hierarchical structure (## followed by ###)
    const hasHierarchy = /#{2} [^\n]+\n[\s\S]*?#{3} /.test(content)
    if (hasHierarchy) {
      bonusScore += 10
      features.push('Good heading hierarchy')
    }

    // Check for emoji in headings (but not excessive)
    const emojiHeadings = (content.match(/#{2,3} [^🚫]*?[📊🎯🔧⚖️🏆📋✨]/g) || []).length
    if (emojiHeadings > 0 && emojiHeadings < 6) {
      bonusScore += 5
      features.push('Appropriate emoji usage')
    }

    return { score: bonusScore, features }
  }

  /**
   * Generate rewrite prompt for fixing issues
   */
  generateRewritePrompt(content, validation) {
    if (validation.isValid) {
      return null // No rewrite needed
    }

    let prompt = "Please rewrite the above content in valid Markdown with better structure:\n\n"
    
    prompt += "**Required fixes:**\n"
    for (const suggestion of validation.suggestions.slice(0, 3)) {
      prompt += `- ${suggestion}\n`
    }

    prompt += "\n**Format requirements:**\n"
    prompt += "- Use ## for main sections and ### for subsections\n"
    prompt += "- Add bullet points or numbered lists for key information\n"
    prompt += "- Use **bold text** for important terms and product names\n"
    prompt += "- Include > **Takeaway:** blockquote at the end\n"
    prompt += "- Keep paragraphs short (2-4 sentences max)\n"
    prompt += "- Ensure proper spacing between sections\n\n"
    
    prompt += "Maintain all the original information while improving the structure and readability."

    return prompt
  }

  /**
   * Auto-fix common markdown issues
   */
  autoFix(content) {
    if (!content) return content

    let fixed = content

    // Fix heading spacing
    fixed = fixed.replace(/(#{1,6})([^\s#])/g, '$1 $2')

    // Ensure double line breaks before main headings
    fixed = fixed.replace(/\n(#{2} [^\n]+)/g, '\n\n$1')

    // Fix list spacing
    fixed = fixed.replace(/\n([-*•] [^\n]+)/g, '\n$1')
    fixed = fixed.replace(/\n(\d+\. [^\n]+)/g, '\n$1')

    // Clean up excessive line breaks
    fixed = fixed.replace(/\n{4,}/g, '\n\n\n')

    // Ensure content ends with single newline
    fixed = fixed.trim() + '\n'

    return fixed
  }
}

module.exports = MarkdownValidator