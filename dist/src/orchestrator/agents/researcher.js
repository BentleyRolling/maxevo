import { searchAndFetch } from "../genius/search.js";
import { planQueries } from "../genius/plan.js";
export async function executeResearch(query, context) {
    // TODO: Implement comprehensive research agent
    // For now, use genius pipeline components
    try {
        const plan = planQueries([{ role: "user", content: query }]);
        const sources = await searchAndFetch(plan);
        return {
            query,
            sources: sources.slice(0, 5), // Limit to top 5 sources
            summary: `Found ${sources.length} relevant sources`,
            plan
        };
    }
    catch (error) {
        return {
            query,
            sources: [],
            summary: "Research failed",
            error: error.message
        };
    }
}
//# sourceMappingURL=researcher.js.map