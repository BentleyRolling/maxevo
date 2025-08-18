/**
 * Normalize plain text into proper Markdown structure
 * Fixes common issues where models output plain text instead of formatted Markdown
 */
export function normalizeMarkdown(content) {
  if (!content || typeof content !== 'string') return content
  
  let s = content.trim()
  
  // Collapse excessive newlines (more than 2 in a row)
  s = s.replace(/\n{3,}/g, '\n\n')
  
  // Turn obvious item lines into bullets
  // Matches lines that start with capital letters but aren't already formatted
  s = s.replace(/(^|\n)(?![-*•] |\d+\. )(?!#{1,6} )(?!> )(?!\|)([A-Z][^\n]{1,80}):?\s*$/gm, '$1- $2')
  
  // Ensure headings have proper spacing after them
  s = s.replace(/(#{1,6} .+)\n(?!\n)/g, '$1\n\n')
  
  // Bold product/model names that appear as isolated lines before bullet lists
  s = s.replace(/(^|\n)([A-Z][A-Za-z0-9\-\s&']{2,50})(?=\n- )/gm, '$1**$2**\n')
  
  // Fix common patterns like "Feature Name: Description" -> "**Feature Name:** Description"
  s = s.replace(/(^|\n)([A-Z][A-Za-z\s]{2,30}):\s*(.+)$/gm, '$1**$2:** $3')
  
  // Ensure proper spacing before sections that start with numbers
  s = s.replace(/(^|\n)(\d+\.?\s*[A-Z])/gm, '$1\n$2')
  
  // Clean up any double spacing we may have created
  s = s.replace(/\n{3,}/g, '\n\n')
  
  return s.trim()
}

/**
 * Check if markdown content needs structural fixes
 */
export function needsMarkdownFix(content) {
  if (!content) return true
  
  const hasHeadings = /(^|\n)#{2,3} /.test(content)
  const hasLists = /(^|\n)[-*•] /.test(content) || /(^|\n)\d+\. /.test(content)
  const hasParagraphs = content.split('\n\n').length > 1
  
  // Content needs fix if it's missing basic markdown structure
  return !hasHeadings || !hasLists || !hasParagraphs
}