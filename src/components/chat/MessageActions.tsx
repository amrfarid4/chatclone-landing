import { useState } from "react";
import { Copy, Check, RefreshCw, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageActionsProps {
  content: string;
  messageId: string;
  isUser?: boolean;
  onRegenerate?: () => void;
  onEdit?: () => void;
  isVisible?: boolean;
  className?: string;
}

/**
 * Action buttons for messages (copy, regenerate, edit)
 * Appears on hover with smooth fade transition
 */
export function MessageActions({
  content,
  isUser,
  onRegenerate,
  onEdit,
  isVisible = false,
  className,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {/* Copy button - available for all messages */}
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
        title={copied ? "Copied!" : "Copy message"}
        aria-label={copied ? "Copied to clipboard" : "Copy message"}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-success" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Regenerate button - only for AI messages */}
      {!isUser && onRegenerate && (
        <button
          onClick={onRegenerate}
          className="p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
          title="Regenerate response"
          aria-label="Regenerate response"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Edit button - only for user messages */}
      {isUser && onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
          title="Edit message"
          aria-label="Edit message"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
