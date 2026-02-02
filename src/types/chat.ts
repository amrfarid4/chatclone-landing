export interface ActionCampaign {
  campaign_id: string;
  trigger_type: string;
  title: string;
  description: string;
  discount_pct?: number;
  duration_days: number;
  target_hours?: string;
  estimated_impact_orders?: number;
  estimated_impact_revenue?: number;
  confidence: string;
  status: string;
}

export type ReportType = "daily-brief" | "weekly-scorecard" | "customer-intelligence";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestedQuestions?: string[];
  actionCampaigns?: ActionCampaign[];
  reportType?: ReportType;
  reportData?: Record<string, unknown>;
  brainInteractionId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SuggestedPrompt {
  id: string;
  title: string;
  description: string;
  icon: string;
}
