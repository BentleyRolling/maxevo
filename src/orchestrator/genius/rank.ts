import { Retrieved } from "../../lib/retriever.js";

export function rankClusterDedup(cands: Retrieved[], plan: any): Retrieved[] {
  // TODO: Implement proper authority/recency/relevance/diversity ranking
  // For now, simple deduplication by URL and limit to max sources
  const seen = new Set<string>();
  const deduped = cands.filter(c => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });
  
  return deduped.slice(0, 7);
}