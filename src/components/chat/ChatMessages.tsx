import { useEffect, useRef, useState, useCallback } from "react";
import { Message } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { LoadingIndicator } from "./LoadingIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
  onSuggestedQuestion?: (question: string) => void;
  onRegenerate?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
}

/**
 * Smart scroll hook - only auto-scrolls when user is at bottom
 * Prevents disorienting scroll jumps when reading older messages
 */
function useSmartScroll() {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewContent, setHasNewContent] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Check if user is near bottom (within 150px threshold)
  const checkIfAtBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;

    const threshold = 150;
    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return scrollBottom < threshold;
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);

    // Clear "new content" indicator when user scrolls to bottom
    if (atBottom) {
      setHasNewContent(false);
    }
  }, [checkIfAtBottom]);

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setHasNewContent(false);
    } else {
      // User is scrolled up, show indicator instead
      setHasNewContent(true);
    }
  }, [isAtBottom]);

  // Manual jump to bottom
  const jumpToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasNewContent(false);
    setIsAtBottom(true);
  }, []);

  return {
    scrollContainerRef,
    bottomRef,
    isAtBottom,
    hasNewContent,
    handleScroll,
    scrollToBottom,
    jumpToBottom,
  };
}

export function ChatMessages({
  messages,
  isLoading = false,
  onSuggestedQuestion,
  onRegenerate,
  onEdit,
}: ChatMessagesProps) {
  const {
    scrollContainerRef,
    bottomRef,
    isAtBottom,
    hasNewContent,
    handleScroll,
    scrollToBottom,
    jumpToBottom,
  } = useSmartScroll();

  // Track previous message count to detect new messages
  const prevMessageCount = useRef(messages.length);

  // Smart scroll on new messages or loading state change
  useEffect(() => {
    const hasNewMessages = messages.length > prevMessageCount.current;
    prevMessageCount.current = messages.length;

    // Only auto-scroll if user was at bottom OR it's the first message
    if (hasNewMessages || isLoading) {
      scrollToBottom();
    }
  }, [messages.length, isLoading, scrollToBottom]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <ScrollArea
        ref={scrollContainerRef}
        className="h-full px-4 scrollbar-thin"
        role="log"
        aria-label="Chat conversation"
        aria-live="polite"
        onScrollCapture={handleScroll}
      >
        <div className="mx-auto max-w-3xl space-y-6 py-6">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isLatest={index === messages.length - 1}
              onSuggestedQuestion={onSuggestedQuestion}
              onRegenerate={
                message.role === "assistant" && onRegenerate
                  ? () => onRegenerate(message.id)
                  : undefined
              }
              onEdit={
                message.role === "user" && onEdit
                  ? () => onEdit(message.id)
                  : undefined
              }
              showSuggestions={index === messages.length - 1 && !isLoading}
            />
          ))}

          {isLoading && (
            <div aria-live="assertive" aria-atomic="true">
              <LoadingIndicator />
            </div>
          )}

          <div ref={bottomRef} tabIndex={-1} aria-hidden="true" />
        </div>
      </ScrollArea>

      {/* Jump to Bottom Button - appears when user scrolls up and new content arrives */}
      <div
        className={cn(
          "absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-300",
          hasNewContent && !isAtBottom
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <Button
          onClick={jumpToBottom}
          size="sm"
          className="gap-2 rounded-full shadow-depth-2 hover:shadow-depth-3 bg-primary/90 backdrop-blur-sm"
          aria-label="Jump to latest message"
        >
          <ArrowDown className="h-4 w-4" />
          New message
        </Button>
      </div>
    </div>
  );
}
