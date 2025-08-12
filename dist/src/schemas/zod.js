import { z } from "zod";
export const ChatRequestZ = z.object({
    messages: z.array(z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1)
    })),
    genius_mode: z.boolean().default(false),
    qc_mode: z.enum(["off", "quick", "deep"]).default("off"),
    honesty_mode: z.boolean().default(false),
    view_mode: z.enum(["chat", "workspace"]).default("chat"),
});
//# sourceMappingURL=zod.js.map