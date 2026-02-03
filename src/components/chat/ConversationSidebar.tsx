import { useState } from "react";
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete?: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ConversationSidebar({
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
  isCollapsed = false,
  onToggleCollapse,
}: ConversationSidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (isCollapsed) {
    return (
      <aside className="w-14 border-r border-border bg-muted/30 flex flex-col h-full py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mx-auto mb-2"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          onClick={onNew}
          size="icon"
          className="mx-auto mb-4"
          aria-label="New chat"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <ScrollArea className="flex-1">
          <div className="flex flex-col items-center gap-1 px-2">
            {conversations.slice(0, 10).map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                  "hover:bg-muted",
                  currentId === conv.id && "bg-muted"
                )}
                title={conv.title}
                aria-label={conv.title}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r border-border bg-muted/30 flex flex-col h-full animate-slide-in-left">
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <Button onClick={onNew} className="flex-1 gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="ml-2"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 px-2">
        <nav aria-label="Conversation history" className="space-y-1 py-2">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className="relative"
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <button
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all duration-200",
                    "hover:bg-muted hover:shadow-depth-1",
                    currentId === conv.id && "bg-muted shadow-depth-1"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {conv.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.preview}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatRelativeTime(conv.updatedAt)}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Delete button - appears on hover */}
                {onDelete && hoveredId === conv.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 animate-fade-in"
                    style={{ opacity: 1 }}
                    aria-label={`Delete conversation: ${conv.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground/60 text-center">
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
        </p>
      </div>
    </aside>
  );
}
