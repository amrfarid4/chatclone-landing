// API Configuration
// Update this URL when deploying to production

export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://web-production-ab3bc.up.railway.app";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AskRequest {
  question: string;
  branch_id: string;
  conversation_history: ConversationMessage[];
}

export interface AskResponse {
  answer: string;
  evidence?: {
    intent?: string;
    scope?: Record<string, unknown>;
    suggestions?: string[];
  };
  timestamp: string;
}

export async function askQuestion(request: AskRequest): Promise<AskResponse> {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
