export function planQueries(messages: any[]): { 
  queries: string[], 
  must_cover: string[], 
  timebound_days: number, 
  max_sources: number 
} {
  // TODO: Implement with LLM call to generate focused queries
  // For now, return a stub that extracts key terms from the last user message
  const lastMessage = messages.filter(m => m.role === "user").pop();
  const content = lastMessage?.content || "";
  
  // Basic query extraction (to be replaced with proper LLM planning)
  const queries = [content]; // Placeholder
  
  return { 
    queries, 
    must_cover: [], 
    timebound_days: 540, 
    max_sources: 7 
  };
}