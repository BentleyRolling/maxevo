export type WorkspaceWidget = {
    id: string;
    type: "RichText";
    data: {
        html: string;
    };
} | {
    id: string;
    type: "Table";
    data: {
        columns: string[];
        rows: Record<string, any>[];
    };
} | {
    id: string;
    type: "CardList";
    data: {
        items: {
            title: string;
            subtitle?: string;
            url?: string;
        }[];
    };
} | {
    id: string;
    type: "Timeline";
    data: {
        events: {
            id: string;
            title: string;
            start: string;
            end: string;
            notes?: string;
        }[];
    };
} | {
    id: string;
    type: "Form";
    data: {
        fields: {
            key: string;
            label: string;
            value?: any;
        }[];
    };
};
export type WorkspaceEvent = {
    jobId: string;
    widgets: WorkspaceWidget[];
    suggestedActions?: {
        id: "retry" | "export" | "approve" | "save";
    }[];
    ts?: number;
};
export type ChatRequest = {
    messages: {
        role: "user" | "assistant" | "system";
        content: string;
    }[];
    genius_mode: boolean;
    qc_mode: "off" | "quick" | "deep";
    honesty_mode: boolean;
    view_mode: "chat" | "workspace";
};
export type ChatResponse = {
    agent: "Max";
    message: string;
    workspace: {
        jobId: string;
        widgets: WorkspaceWidget[];
        suggestedActions?: WorkspaceEvent["suggestedActions"];
    };
    meta?: {
        sources?: any[];
        models_used?: string[];
        latency_ms?: number;
        tokens_estimated?: number;
    };
};
//# sourceMappingURL=workspace.d.ts.map