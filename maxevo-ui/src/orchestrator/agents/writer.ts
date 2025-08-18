export async function executeWrite(
  messages: any[], 
  research?: any, 
  options?: { honestyMode?: boolean }
): Promise<any> {
  const lastMessage = messages.filter(m => m.role === "user").pop();
  const question = lastMessage?.content || "";
  const honestyMode = options?.honestyMode || false;
  
  // Generate response based on honesty mode
  let response = "";
  
  if (honestyMode) {
    // Honest mode: truth that empowers founders, not crushes dreams
    response = generateFounderHonestResponse(question, research);
  } else {
    // Standard mode: more conversational, includes hedging and softer language
    response = generateStandardResponse(question, research);
  }
  
  return {
    text: response,
    word_count: response.split(/\s+/).length,
    sources_used: research?.sources?.length || 0,
    honesty_mode: honestyMode
  };
}

function generateFounderHonestResponse(question: string, research?: any): string {
  let response = "";
  
  // Detect the type of question to tailor the honest response
  const questionLower = question.toLowerCase();
  
  // Business/startup questions
  if (questionLower.includes("start") && (questionLower.includes("business") || questionLower.includes("company") || questionLower.includes("startup"))) {
    response = generateBusinessHonestyResponse(question, research);
  }
  // Investment/financial decisions
  else if (questionLower.includes("invest") || questionLower.includes("buy") || questionLower.includes("crypto") || questionLower.includes("stock")) {
    response = generateInvestmentHonestyResponse(question, research);
  }
  // Career/life decisions
  else if (questionLower.includes("quit") || questionLower.includes("career") || questionLower.includes("job")) {
    response = generateCareerHonestyResponse(question, research);
  }
  // General honest response
  else {
    response = generateGeneralHonestyResponse(question, research);
  }
  
  // Add research sources if available
  if (research && research.sources && research.sources.length > 0) {
    response += "\n\n**Current Data:**\n";
    research.sources.slice(0, 3).forEach((source: any, i: number) => {
      response += `• ${source.title} - ${source.snippet || "No summary"}\n`;
    });
  }
  
  return response;
}

function generateBusinessHonestyResponse(question: string, research?: any): string {
  return `I love the entrepreneurial drive! Let me give you the real data so you can build this right.

Most new businesses face significant challenges - but that's where preparation gives you the edge. The founders who succeed share common traits: they validate demand first, understand their market deeply, and have sufficient runway.

Here's my honest take: ${getContextualBusinessAdvice(question)}

The dream is absolutely achievable - but treat this like building a real business, not a quick win. Smart founders stack the odds in their favor through research, planning, and calculated risks.`;
}

function generateInvestmentHonestyResponse(question: string, research?: any): string {
  return `I understand you're looking at investment opportunities. Let me be straight with you about the realities.

Markets are inherently unpredictable, and past performance doesn't guarantee future results. Most retail investors underperform market averages due to emotional decisions and timing mistakes.

That said, successful investors focus on: diversification, long-term thinking, and only investing what they can afford to lose in speculative assets.

My honest recommendation: ${getContextualInvestmentAdvice(question)}

This isn't financial advice - I'm giving you the framework successful investors use to make informed decisions.`;
}

function generateCareerHonestyResponse(question: string, research?: any): string {
  return `Career transitions are some of the most important decisions we make. Let me give you the unvarnished truth to help you succeed.

Major career moves always involve risk, but calculated risks with proper planning often lead to breakthrough opportunities. The key is understanding what you're walking into.

Here's what I've observed: ${getContextualCareerAdvice(question)}

I'm not trying to talk you out of anything - I want to make sure you have the full picture to make the best decision for your situation.`;
}

function generateGeneralHonestyResponse(question: string, research?: any): string {
  return `Let me give you a straight answer on this.

${getContextualGeneralAdvice(question)}

I believe in giving you the complete picture - both opportunities and challenges - so you can make the best informed decision possible.`;
}

function getContextualBusinessAdvice(question: string): string {
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes("dropship")) {
    return "Dropshipping has a 90% failure rate in year one, mostly due to poor product research and undercapitalization. But the 10% who succeed validate demand first and focus on problem-solving products. Start nights/weekends, aim for $5K/month profit for 3 months before going full-time.";
  }
  if (questionLower.includes("app") || questionLower.includes("software")) {
    return "App success rates are brutal - less than 1% make significant money. But successful apps solve real problems for specific audiences. Build an MVP, get real user feedback, and iterate based on actual usage data before investing heavily.";
  }
  if (questionLower.includes("restaurant") || questionLower.includes("food")) {
    return "Restaurant failure rates are high (80% within 5 years) due to thin margins, high overhead, and operational complexity. Successful restaurants obsess over location, cost control, and customer experience. Consider starting with catering or food trucks to test your concept first.";
  }
  
  return "Success rates vary by industry, but preparation and market validation are universal success factors. Test your assumptions with real customers before committing significant resources.";
}

function getContextualInvestmentAdvice(question: string): string {
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes("crypto")) {
    return "Crypto is highly volatile - many retail investors lose money due to FOMO and poor timing. If you're investing, only use money you can afford to lose completely, dollar-cost average, and focus on established coins rather than meme tokens.";
  }
  if (questionLower.includes("stock") || questionLower.includes("share")) {
    return "Individual stock picking is hard - most professionals don't beat the market consistently. Consider low-cost index funds for your core holdings, and limit individual stocks to a small percentage if you want to pick specific companies.";
  }
  if (questionLower.includes("real estate")) {
    return "Real estate can build wealth, but requires significant capital, market knowledge, and ongoing management. Factor in maintenance costs, vacancy periods, and local market conditions. REITs might be a easier way to get real estate exposure initially.";
  }
  
  return "Focus on fundamentals: diversify, invest regularly, keep costs low, and don't try to time the market. Boring strategies often win over time.";
}

function getContextualCareerAdvice(question: string): string {
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes("quit")) {
    return "Quitting without a plan is risky, but staying in the wrong role too long stunts growth. Have 6+ months expenses saved, a clear next step, and make sure you're leaving FOR something, not just away from something.";
  }
  if (questionLower.includes("freelance") || questionLower.includes("consultant")) {
    return "Freelancing offers freedom but requires discipline and business skills beyond your core expertise. Start building clients while employed, save a larger emergency fund, and understand that income will be inconsistent initially.";
  }
  
  return "Career moves work best when they align with your long-term goals and you've built the necessary skills and network. Take calculated risks, but have a safety net.";
}

function getContextualGeneralAdvice(question: string): string {
  return "Based on available data and real-world patterns, here's what typically works and what doesn't. I'm focusing on actionable insights that can improve your odds of success.";
}

function generateStandardResponse(question: string, research?: any): string {
  let response = `I'd be happy to help you with: ${question}\n\n`;
  
  if (research && research.sources && research.sources.length > 0) {
    response += "## Research Findings\n\n";
    response += "Based on my research, I've found some incredible insights that might be helpful:\n\n";
    research.sources.slice(0, 3).forEach((source: any, i: number) => {
      response += `**Source ${i + 1}**: ${source.title}\n`;
      response += `This amazing resource suggests: ${source.snippet || "No summary available"}\n\n`;
    });
  }
  
  response += "## My Analysis\n\n";
  response += "Based on the available information and my comprehensive analysis, I believe this could be a game-changing approach. ";
  response += "You might want to consider that this response was generated using MaxEvo's incredible multi-agent architecture. ";
  response += "Perhaps the most amazing aspect is how the specialized research and writing components work together seamlessly.\n\n";
  response += "I hope this helps, and please let me know if you'd like me to explore any other aspects of your question!";
  
  return response;
}