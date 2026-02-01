// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'https://web-production-ab3bc.up.railway.app';

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AskResponse {
  answer: string;
  suggested_questions?: string[];
  evidence?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp: string;
  processing_time_ms?: number;
}

export interface BranchInfo {
  branch_id: string;
  branch_name: string;
}

export interface CampaignPreview {
  campaign_id: string;
  trigger_type: string;
  title: string;
  description: string;
  discount_pct?: number;
  duration_days: number;
  estimated_impact_orders?: number;
  estimated_impact_revenue?: number;
  confidence: string;
  status: string;
}

export async function askQuestion(
  question: string,
  branchId: string = 'all',
  conversationHistory: { role: string; content: string }[] = []
): Promise<AskResponse> {
  const response = await fetch(`${API_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      branch_id: branchId,
      conversation_history: conversationHistory,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function getBranches(): Promise<BranchInfo[]> {
  const response = await fetch(`${API_URL}/branches`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export async function getCampaignPreview(
  recommendation: string,
  intent: string = 'general'
): Promise<CampaignPreview> {
  const response = await fetch(`${API_URL}/campaign/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recommendation, intent }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function submitCampaignAction(
  campaignId: string,
  action: 'approved' | 'rejected',
  notes: string = ''
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/campaign/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaign_id: campaignId, action, notes }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function checkHealth(): Promise<{
  status: string;
  database_connected: boolean;
  version: string;
}> {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}
