export function planQueries(messages) {
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
//# sourceMappingURL=plan.js.map