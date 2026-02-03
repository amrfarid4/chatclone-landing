import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Command } from "lucide-react";
import { Message } from "@/types/chat";
import { suggestedPrompts } from "@/data/mockData";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { SuggestionChips } from "./SuggestionChips";
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
import { toast } from "sonner";
import dyneLogo from "@/assets/dyne-logo.png";

// Patterns that trigger report endpoints instead of /ask
const REPORT_TRIGGERS: { pattern: RegExp; type: "daily-brief" | "weekly-scorecard" | "customer-intelligence" }[] = [
  { pattern: /\b(daily\s*brief|morning\s*brief|today'?s?\s*(numbers|brief|report)|what\s*happened\s*yesterday)\b/i, type: "daily-brief" },
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
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Focus input
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Cmd/Ctrl + Shift + C: Copy last response
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "c") {
        e.preventDefault();
        const lastAssistantMessage = [...messages].reverse().find(m => m.role === "assistant");
        if (lastAssistantMessage) {
          navigator.clipboard.writeText(lastAssistantMessage.content);
          toast.success("Copied to clipboard");
        }
      }

      // Escape: New chat (when not typing)
      if (e.key === "Escape" && document.activeElement !== inputRef.current) {
        handleNewChat();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [messages]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
  }, []);

  const handleSendMessage = useCallback(
    async (content: string, previousMessages?: Message[]) => {
      if (!content.trim()) return;

      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      const baseMessages = previousMessages ?? messages;
      const updatedMessages = [...baseMessages, userMessage];
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
          const history = baseMessages.map((msg) => ({
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
            brainInteractionId: data.metadata?.brain_interaction_id as string | undefined,
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

  // Regenerate response - re-sends the user's message that triggered this response
  const handleRegenerate = useCallback(
    async (messageId: string) => {
      // Find the AI message index
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex <= 0) return;

      // Find the user message that triggered this response
      const userMessage = messages[messageIndex - 1];
      if (userMessage.role !== "user") return;

      // Remove messages from this point forward
      const previousMessages = messages.slice(0, messageIndex - 1);

      // Re-send the user's message
      await handleSendMessage(userMessage.content, previousMessages);
    },
    [messages, handleSendMessage]
  );

  // Edit message - for now, just show a toast (full implementation would need inline editing)
  const handleEdit = useCallback(
    (messageId: string) => {
      const message = messages.find(m => m.id === messageId);
      if (message && inputRef.current) {
        // Put the message content in the input
        inputRef.current.value = message.content;
        inputRef.current.focus();
        toast.info("Edit your message and press Enter to resend");
      }
    },
    [messages]
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
      {/* Header with Branch Selector and New Chat button - Glass style */}
      <header className="flex items-center justify-between glass-subtle border-b border-border/50 px-4 py-3 sticky top-0 z-10">
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
        <div className="flex items-center gap-2">
          {/* Keyboard shortcut hint */}
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
            <Command className="h-3 w-3" />
            <span>K to focus</span>
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
      </header>

      {/* Chat Content */}
      {hasMessages ? (
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          onSuggestedQuestion={handleSendMessage}
          onRegenerate={handleRegenerate}
          onEdit={handleEdit}
        />
      ) : (
        <WelcomeScreen onSelectPrompt={handleSelectPrompt} />
      )}

      {/* Input Area - Fixed at bottom with glass effect */}
      <footer className="border-t border-border/50 glass-subtle p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {hasMessages && (
            <SuggestionChips
              prompts={suggestedPrompts}
              onSelectPrompt={handleSelectPrompt}
              disabled={isLoading}
            />
          )}
          <ChatInput
            ref={inputRef}
            onSend={(content) => handleSendMessage(content)}
            disabled={isLoading}
          />
          {/* Keyboard shortcuts hint */}
          <p id="input-hint" className="sr-only">
            Press Enter to send, Shift+Enter for new line, Escape for new chat
          </p>
        </div>
      </footer>
    </div>
  );
}
