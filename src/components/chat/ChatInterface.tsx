import { useState, useCallback, useEffect } from "react";
import { Plus } from "lucide-react";
import { Message } from "@/types/chat";
import { suggestedPrompts } from "@/data/mockData";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { SuggestionChips } from "./SuggestionChips";
import { askQuestion, getBranches, type BranchInfo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dyneLogo from "@/assets/dyne-logo.png";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("all");

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

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
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
        };

        setMessages([...updatedMessages, aiMessage]);
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
      {hasMessages ? (
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
