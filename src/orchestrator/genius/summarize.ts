import { Retrieved } from "../../lib/retriever.js";

export async function summarizeSources(sources: Retrieved[]): Promise<any[]> {
  // TODO: Implement proper LLM-based summarization
  // For now, return structured summaries with key points and claims
  return sources.map(s => ({
    url: s.url,
    title: s.title,
    published_at: s.published_at,
    key_points: [s.snippet || "No snippet available"],
    claims: []
  }));
}