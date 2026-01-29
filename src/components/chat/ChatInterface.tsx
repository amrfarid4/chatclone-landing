import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Message } from "@/types/chat";
import { suggestedPrompts } from "@/data/mockData";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { SuggestionChips } from "./SuggestionChips";
import { askQuestion } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

      // Add user message immediately
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);

      try {
        // Call the backend API
        const response = await askQuestion({
          question: content.trim(),
          branch_id: "all",
          conversation_history: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        });

        // Add AI response
        const aiMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: response.answer || "I couldn't generate a response. Please try rephrasing.",
          timestamp: new Date(),
        };

        setMessages([...updatedMessages, aiMessage]);
      } catch (error) {
        console.error("Error calling API:", error);

        // Show user-friendly error message
        const errorMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: error instanceof TypeError 
            ? "Sorry, I couldn't connect to the server. Please check your connection."
            : "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };

        setMessages([...updatedMessages, errorMessage]);
      } finally {
        setIsLoading(false);
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
      {/* Header with New Chat button - only show when in conversation */}
      {hasMessages && (
        <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
          <div className="text-sm font-medium text-foreground">dyne</div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      )}

      {/* Chat Content */}
      {hasMessages ? (
        <ChatMessages messages={messages} isLoading={isLoading} />
      ) : (
        <WelcomeScreen prompts={suggestedPrompts} onSelectPrompt={handleSelectPrompt} />
      )}

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-border bg-background p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Suggestion chips when in conversation */}
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
