export interface MessageRequest {
  message: string;
  genius_mode: boolean;
  qc_mode: "off" | "quick" | "deep";
  honesty_mode: boolean;
  view_mode: "chat" | "workspace";
}

export interface MessageResponse {
  agent: "Max";
  message: string;
  workspace: {
    jobId: string;
    widgets: any[];
    suggestedActions?: Array<{ id: string }>;
  };
  meta?: {
    sources?: any[];
    models_used?: string[];
    latency_ms?: number;
    tokens_estimated?: number;
  };
}

export async function sendMessage(
  request: MessageRequest,
  messages: Array<{ role: string; content: string }> = []
): Promise<MessageResponse> {
  
  const chatRequest = {
    messages: [
      ...messages,
      { role: "user", content: request.message }
    ],
    genius_mode: request.genius_mode,
    qc_mode: request.qc_mode,
    honesty_mode: request.honesty_mode,
    view_mode: request.view_mode
  };

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': 'demo-user' // TODO: Get from auth context
    },
    body: JSON.stringify(chatRequest)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}