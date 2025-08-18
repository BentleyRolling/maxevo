import { WorkspaceWidget } from "../../types/workspace.js";

export type AgentTask = { 
  id: string; 
  goal: string; 
  input: any; 
  context: any; 
  toolsAllowed?: string[]; 
  deadlineMs?: number 
};

export type AgentResult = { 
  id: string; 
  success: boolean; 
  data: any; 
  metrics?: any; 
  log?: string[] 
};

export async function runOrchestrated(
  goal: string, 
  context: any, 
  opts: { qc: "off"|"quick"|"deep"; honestyMode?: boolean }
): Promise<{ text: string; widgets: WorkspaceWidget[] }> {
  // TODO: Implement proper multi-agent orchestration
  // For now, a simplified flow: research → write → verify
  
  const tasks: AgentTask[] = [];
  const results: AgentResult[] = [];
  
  // 1. Research phase
  if (needsResearch(goal, context)) {
    tasks.push({
      id: "research",
      goal: "Gather relevant information",
      input: context.messages,
      context
    });
  }
  
  // 2. Writing phase
  tasks.push({
    id: "write",
    goal: "Generate response",
    input: context.messages,
    context: { ...context, honestyMode: opts.honestyMode }
  });
  
  // 3. Verification phase (if QC enabled)
  if (opts.qc !== "off") {
    tasks.push({
      id: "verify",
      goal: "Quality check response",
      input: "pending_response",
      context: { qc_mode: opts.qc }
    });
  }
  
  // Execute tasks sequentially for now (could be parallel where safe)
  for (const task of tasks) {
    const result = await executeTask(task);
    results.push(result);
    
    if (!result.success) {
      console.warn(`Task ${task.id} failed:`, result.log);
    }
  }
  
  // Merge results
  const writeResult = results.find(r => r.id === "write");
  const text = writeResult?.data?.text || "Unable to generate response";
  
  // Generate workspace widgets based on the task type
  const widgets: WorkspaceWidget[] = generateWidgets(goal, results);
  
  return { text, widgets };
}

function needsResearch(goal: string, context: any): boolean {
  // Simple heuristic - research if question seems factual
  const lastMessage = context.messages?.filter((m: any) => m.role === "user").pop();
  const content = lastMessage?.content?.toLowerCase() || "";
  
  const researchKeywords = ["what is", "how to", "when did", "who is", "compare", "analyze"];
  return researchKeywords.some(keyword => content.includes(keyword));
}

async function executeTask(task: AgentTask): Promise<AgentResult> {
  // TODO: Route to specialized agents based on task.id
  // For now, simple mock execution
  
  try {
    switch (task.id) {
      case "research":
        const researchData = await executeResearch(task);
        return { id: task.id, success: true, data: researchData, log: ["Research completed"] };
        
      case "write":
        const writeData = await executeWrite(task);
        return { id: task.id, success: true, data: writeData, log: ["Writing completed"] };
        
      case "verify":
        const verifyData = await executeVerify(task);
        return { id: task.id, success: true, data: verifyData, log: ["Verification completed"] };
        
      default:
        throw new Error(`Unknown task type: ${task.id}`);
    }
  } catch (error) {
    return { 
      id: task.id, 
      success: false, 
      data: null, 
      log: [`Error: ${(error as Error).message}`] 
    };
  }
}

async function executeResearch(task: AgentTask): Promise<any> {
  // TODO: Call researcher agent
  return { sources: [], summary: "Research summary placeholder" };
}

async function executeWrite(task: AgentTask): Promise<any> {
  // Call the actual writer agent
  const { executeWrite: writerExecute } = await import('./writer.js');
  const honestyMode = task.context?.honestyMode || false;
  
  return await writerExecute(
    task.input || [], 
    undefined, // no research data in standard orchestration
    { honestyMode }
  );
}

async function executeVerify(task: AgentTask): Promise<any> {
  // TODO: Call verifier agent
  return { verified: true, confidence: 0.85 };
}

function generateWidgets(goal: string, results: AgentResult[]): WorkspaceWidget[] {
  const widgets: WorkspaceWidget[] = [];
  
  // Add a summary widget if we have multiple results
  if (results.length > 1) {
    widgets.push({
      id: "execution-summary",
      type: "Table",
      data: {
        columns: ["Task", "Status", "Details"],
        rows: results.map(r => ({
          Task: r.id,
          Status: r.success ? "✓ Success" : "✗ Failed",
          Details: r.log?.join("; ") || "No details"
        }))
      }
    });
  }
  
  return widgets;
}