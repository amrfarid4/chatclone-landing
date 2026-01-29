import { Plus, MessageSquare, Moon, Sun, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Conversation } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  theme,
  onToggleTheme,
  isCollapsed,
  onToggleCollapse,
}: ChatSidebarProps) {
  if (isCollapsed) {
    return (
      <div className="flex h-full w-14 flex-col border-r border-sidebar-border bg-sidebar p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mb-2 h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewChat}
          className="mb-4 h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Plus className="h-5 w-5" />
        </Button>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          className="h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar animate-slide-in-left">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-sidebar-border">
        <h2 className="text-sm font-semibold text-sidebar-foreground">Chats</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-2 scrollbar-thin">
        <div className="space-y-1 pb-4">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={cn(
                "w-full rounded-lg p-3 text-left transition-colors duration-150",
                "hover:bg-sidebar-accent",
                activeConversationId === conversation.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground"
              )}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 opacity-60" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{conversation.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatRelativeDate(conversation.updatedAt)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          onClick={onToggleTheme}
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {theme === "light" ? (
            <>
              <Moon className="h-4 w-4" />
              Dark mode
            </>
          ) : (
            <>
              <Sun className="h-4 w-4" />
              Light mode
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
