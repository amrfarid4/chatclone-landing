import { useState, useCallback } from "react";
import { Conversation, Message } from "@/types/chat";
import { mockConversations, suggestedPrompts } from "@/data/mockData";
import { useTheme } from "@/hooks/useTheme";
import { ChatSidebar } from "./ChatSidebar";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ChatInterface() {
  const { theme, toggleTheme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setIsMobileSidebarOpen(false);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setIsMobileSidebarOpen(false);
  }, []);

  const handleSendMessage = useCallback(
    (content: string) => {
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      // Simulate AI response
      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: `This is a mock response to: "${content}"\n\nIn a real implementation, this would connect to an AI API like OpenAI or Claude to generate a meaningful response.\n\n**Features demonstrated:**\n- Message bubbles with user/AI distinction\n- Markdown formatting support\n- Code block rendering\n\n\`\`\`javascript\nconsole.log("Hello, World!");\n\`\`\``,
        timestamp: new Date(),
      };

      if (activeConversationId) {
        // Add to existing conversation
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, userMessage, aiMessage],
                  updatedAt: new Date(),
                }
              : conv
          )
        );
      } else {
        // Create new conversation
        const newConversation: Conversation = {
          id: `conv-${Date.now()}`,
          title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
          messages: [userMessage, aiMessage],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setConversations((prev) => [newConversation, ...prev]);
        setActiveConversationId(newConversation.id);
      }
    },
    [activeConversationId]
  );

  const handleSelectPrompt = useCallback(
    (prompt: string) => {
      handleSendMessage(prompt);
    },
    [handleSendMessage]
  );

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          theme={theme}
          onToggleTheme={toggleTheme}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Sidebar - Mobile */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          theme={theme}
          onToggleTheme={toggleTheme}
          isCollapsed={false}
          onToggleCollapse={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Header */}
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground">
            {activeConversation?.title || "New Chat"}
          </h1>
        </header>

        {/* Chat Content */}
        {activeConversation && activeConversation.messages.length > 0 ? (
          <ChatMessages messages={activeConversation.messages} />
        ) : (
          <WelcomeScreen prompts={suggestedPrompts} onSelectPrompt={handleSelectPrompt} />
        )}

        {/* Input Area */}
        <div className="border-t border-border bg-background p-4">
          <div className="mx-auto max-w-3xl">
            <ChatInput onSend={handleSendMessage} />
          </div>
        </div>
      </div>
    </div>
  );
}
