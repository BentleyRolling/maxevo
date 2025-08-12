import { z } from "zod";
export declare const ChatRequestZ: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant", "system"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        role: "user" | "assistant" | "system";
        content: string;
    }, {
        role: "user" | "assistant" | "system";
        content: string;
    }>, "many">;
    genius_mode: z.ZodDefault<z.ZodBoolean>;
    qc_mode: z.ZodDefault<z.ZodEnum<["off", "quick", "deep"]>>;
    honesty_mode: z.ZodDefault<z.ZodBoolean>;
    view_mode: z.ZodDefault<z.ZodEnum<["chat", "workspace"]>>;
}, "strip", z.ZodTypeAny, {
    messages: {
        role: "user" | "assistant" | "system";
        content: string;
    }[];
    genius_mode: boolean;
    qc_mode: "off" | "quick" | "deep";
    honesty_mode: boolean;
    view_mode: "chat" | "workspace";
}, {
    messages: {
        role: "user" | "assistant" | "system";
        content: string;
    }[];
    genius_mode?: boolean | undefined;
    qc_mode?: "off" | "quick" | "deep" | undefined;
    honesty_mode?: boolean | undefined;
    view_mode?: "chat" | "workspace" | undefined;
}>;
//# sourceMappingURL=zod.d.ts.map