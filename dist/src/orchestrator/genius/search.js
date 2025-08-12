import { searchWeb, searchNews, fetchAndCache, normKey } from "../../lib/retriever.js";
export async function searchAndFetch(plan) {
    const useNews = plan.timebound_days <= 90;
    const runs = await Promise.all(plan.queries.map(q => fetchAndCache(normKey({ q, useNews }), () => useNews ? searchNews(q) : searchWeb(q))));
    return runs.flat();
}
//# sourceMappingURL=search.js.map