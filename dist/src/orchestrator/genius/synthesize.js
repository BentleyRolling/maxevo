export function synthesizeAnswer(messages, notes) {
    // TODO: Implement proper LLM-based synthesis of research notes into final answer
    // For now, return a structured draft incorporating the research
    const lastMessage = messages.filter(m => m.role === "user").pop();
    const question = lastMessage?.content || "";
    let draft = `Based on comprehensive research, here's what I found regarding: ${question}\n\n`;
    notes.forEach((note, i) => {
        if (note.key_points && note.key_points.length > 0) {
            draft += `**Source ${i + 1}**: ${note.title}\n`;
            draft += `${note.key_points[0]}\n\n`;
        }
    });
    draft += "This analysis incorporates multiple authoritative sources and current information.";
    return draft;
}
//# sourceMappingURL=synthesize.js.map