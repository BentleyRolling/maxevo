import { WorkspaceWidget } from "../../types/workspace.js";
export type AgentTask = {
    id: string;
    goal: string;
    input: any;
    context: any;
    toolsAllowed?: string[];
    deadlineMs?: number;
};
export type AgentResult = {
    id: string;
    success: boolean;
    data: any;
    metrics?: any;
    log?: string[];
};
export declare function runOrchestrated(goal: string, context: any, opts: {
    qc: "off" | "quick" | "deep";
    honestyMode?: boolean;
}): Promise<{
    text: string;
    widgets: WorkspaceWidget[];
}>;
//# sourceMappingURL=coordinator.d.ts.map