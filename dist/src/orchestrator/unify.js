export function unifyVoice(text, opts) {
    let out = text.trim().replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
    if (opts.honesty) {
        // Remove hype adjectives and superlatives
        const banned = [
            /incredible/gi,
            /amazing/gi,
            /awesome/gi,
            /fantastic/gi,
            /wonderful/gi,
            /excellent/gi,
            /outstanding/gi,
            /remarkable/gi,
            /extraordinary/gi,
            /game[- ]changer/gi,
            /game[- ]changing/gi,
            /superb/gi,
            /brilliant/gi,
            /perfect/gi,
            /ultimate/gi
        ];
        banned.forEach((re) => out = out.replace(re, ""));
        // Remove hedging phrases and filler words
        const hedgingPatterns = [
            /\byou might want to consider\b/gi,
            /\bperhaps\b/gi,
            /\bwe recommend\b/gi,
            /\bexcited to\b/gi,
            /\bi'd be happy to\b/gi,
            /\bi hope this helps\b/gi,
            /\blet me know if you'd like\b/gi,
            /\bmight\b/gi,
            /\bcould\b/gi,
            /\bmaybe\b/gi,
            /\bpossibly\b/gi,
            /\bit seems\b/gi,
            /\bwe suggest\b/gi,
            /\bi believe\b/gi,
            /\bin my opinion\b/gi,
            /\bplease\b/gi
        ];
        hedgingPatterns.forEach((re) => out = out.replace(re, ""));
        // Clean up extra spaces and punctuation caused by removals
        out = out.replace(/\s+/g, " ");
        out = out.replace(/\s*,\s*/g, ", ");
        out = out.replace(/\s*\.\s*/g, ". ");
        out = out.replace(/\s*!\s*/g, ". ");
        out = out.replace(/\.\s*\./g, ".");
        out = out.replace(/,\s*,/g, ",");
        // Remove empty sentences and fix punctuation
        out = out.replace(/\.\s*\./g, ".");
        out = out.replace(/\s+\./g, ".");
        out = out.replace(/^\s*\.\s*/gm, "");
    }
    return out.trim();
}
//# sourceMappingURL=unify.js.map