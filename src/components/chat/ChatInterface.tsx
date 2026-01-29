import { useState, useCallback } from "react";
import { Message } from "@/types/chat";
import { suggestedPrompts } from "@/data/mockData";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { LoadingIndicator } from "./LoadingIndicator";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      // Add user message immediately
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Simulate AI thinking delay (1.5-2s)
      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 500));

      // Simulate AI response
      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: `Based on your query about "${content}", here's my analysis:

**Key Insights:**
1. Your data shows interesting patterns that we should explore further
2. There are several factors contributing to the current trends
3. I've identified some actionable recommendations

### Recommendations

- **Short-term:** Focus on optimizing your current top performers
- **Medium-term:** Consider expanding into adjacent opportunities
- **Long-term:** Build sustainable growth patterns

Would you like me to dive deeper into any of these areas?`,
        timestamp: new Date(),
      };

      setIsLoading(false);
      setMessages((prev) => [...prev, aiMessage]);
    },
    []
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
      {/* Chat Content */}
      {hasMessages ? (
        <ChatMessages messages={messages} isLoading={isLoading} />
      ) : (
        <WelcomeScreen prompts={suggestedPrompts} onSelectPrompt={handleSelectPrompt} />
      )}

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-border bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
