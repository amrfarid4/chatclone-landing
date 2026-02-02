import { useState, useCallback, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Message } from "@/types/chat";
import { suggestedPrompts } from "@/data/mockData";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { SuggestionChips } from "./SuggestionChips";
import { BriefLoadingScreen } from "./reports/BriefLoadingScreen";
import {
  askQuestion,
  getBranches,
  getDailyBrief,
  getWeeklyScorecard,
  getCustomerIntelligence,
  type BranchInfo,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dyneLogo from "@/assets/dyne-logo.png";

// Patterns that trigger report endpoints instead of /ask
const REPORT_TRIGGERS: { pattern: RegExp; type: "daily-brief" | "weekly-scorecard" | "customer-intelligence" }[] = [
  { pattern: /\b(daily\s*brief|morning\s*brief|today'?s?\s*(numbers|brief|report))\b/i, type: "daily-brief" },
  { pattern: /\b(weekly\s*scorecard|week\s*report|weekly\s*report|scorecard)\b/i, type: "weekly-scorecard" },
  { pattern: /\b(customer\s*intel|customer\s*intelligence|vip\s*customers?|at[\s-]?risk|tier\s*breakdown|customer\s*segments?)\b/i, type: "customer-intelligence" },
];

function detectReportTrigger(text: string) {
  for (const t of REPORT_TRIGGERS) {
    if (t.pattern.test(text)) return t.type;
  }
  return null;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [briefLoading, setBriefLoading] = useState(true);
  const [briefFadingOut, setBriefFadingOut] = useState(false);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const briefLoaded = useRef(false);

  // Load branches
  useEffect(() => {
    getBranches()
      .then(setBranches)
      .catch(() => {
        setBranches([
          { branch_id: "all", branch_name: "All Branches (Compare)" },
          { branch_id: "Willow's", branch_name: "Willow's" },
          { branch_id: "Willow's D5", branch_name: "Willow's D5" },
        ]);
      });
  }, []);

  // Auto-load daily brief on mount
  useEffect(() => {
    if (briefLoaded.current) return;
    briefLoaded.current = true;

    getDailyBrief()
      .then((res) => {
        const briefMessage: Message = {
          id: `msg-brief-${Date.now()}`,
          role: "assistant",
          content: res.brief,
          timestamp: new Date(),
          reportType: "daily-brief",
          reportData: res.data,
          suggestedQuestions: [
            "Show weekly scorecard",
            "Customer intelligence report",
            "Why is revenue down?",
          ],
        };
        setMessages([briefMessage]);
        // Fade out loading screen, then reveal content
        setBriefFadingOut(true);
        setTimeout(() => setBriefLoading(false), 350);
      })
      .catch(() => {
        // Silently fall back to WelcomeScreen
        setBriefFadingOut(true);
        setTimeout(() => setBriefLoading(false), 350);
      });
  }, []);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setBriefLoading(false);
  }, []);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);

      try {
        const reportType = detectReportTrigger(content.trim());

        if (reportType) {
          // Call dedicated report endpoint
          let aiMessage: Message;

          if (reportType === "daily-brief") {
            const res = await getDailyBrief();
            aiMessage = {
              id: `msg-${Date.now() + 1}`,
              role: "assistant",
              content: res.brief,
              timestamp: new Date(),
              reportType: "daily-brief",
              reportData: res.data,
              suggestedQuestions: ["Show weekly scorecard", "Customer intelligence report", "Why is revenue down?"],
            };
          } else if (reportType === "weekly-scorecard") {
            const res = await getWeeklyScorecard();
            aiMessage = {
              id: `msg-${Date.now() + 1}`,
              role: "assistant",
              content: res.scorecard,
              timestamp: new Date(),
              reportType: "weekly-scorecard",
              reportData: res.data,
              suggestedQuestions: ["Customer intelligence report", "Show daily brief", "Why did orders drop?"],
            };
          } else {
            const res = await getCustomerIntelligence();
            aiMessage = {
              id: `msg-${Date.now() + 1}`,
              role: "assistant",
              content: res.overview?.summary as string || "Here's your customer intelligence report.",
              timestamp: new Date(),
              reportType: "customer-intelligence",
              reportData: res as unknown as Record<string, unknown>,
              suggestedQuestions: ["Show weekly scorecard", "Show daily brief", "How do I retain at-risk customers?"],
            };
          }

          setMessages([...updatedMessages, aiMessage]);
        } else {
          // Regular /ask call
          const history = messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));

          const data = await askQuestion(content.trim(), selectedBranch, history);

          const aiMessage: Message = {
            id: `msg-${Date.now() + 1}`,
            role: "assistant",
            content: data.answer,
            timestamp: new Date(),
            suggestedQuestions: data.suggested_questions,
            actionCampaigns: data.action_campaigns,
          };

          setMessages([...updatedMessages, aiMessage]);
        }
      } catch (error) {
        console.error("Error calling API:", error);

        const errorMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content:
            error instanceof TypeError
              ? "Sorry, I couldn't connect to the server. Please check your connection."
              : "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date(),
        };

        setMessages([...updatedMessages, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, selectedBranch]
  );

  const handleSelectPrompt = useCallback(
    (prompt: string) => {
      handleSendMessage(prompt);
    },
    [handleSendMessage]
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Header with Branch Selector and New Chat button */}
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-4">
          <img src={dyneLogo} alt="dyne" className="h-6 w-auto" />
          {branches.length > 0 && (
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.branch_id} value={b.branch_id}>
                    {b.branch_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {hasMessages && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        )}
      </div>

      {/* Chat Content */}
      {briefLoading ? (
        <BriefLoadingScreen fadeOut={briefFadingOut} />
      ) : hasMessages ? (
        <ChatMessages messages={messages} isLoading={isLoading} onSuggestedQuestion={handleSendMessage} />
      ) : (
        <WelcomeScreen prompts={suggestedPrompts} onSelectPrompt={handleSelectPrompt} />
      )}

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-border bg-background p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {hasMessages && (
            <SuggestionChips
              prompts={suggestedPrompts}
              onSelectPrompt={handleSelectPrompt}
              disabled={isLoading}
            />
          )}
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
