import { useState, useRef, KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Message dyne...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const hasContent = value.trim().length > 0;

  return (
    <div className="relative">
      <div className="flex items-end gap-2 rounded-3xl border border-border bg-card p-2 shadow-sm transition-all focus-within:shadow-md focus-within:border-primary/40">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "min-h-[44px] max-h-[200px] flex-1 resize-none border-0 bg-transparent px-3 py-2",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "placeholder:text-muted-foreground/60",
            "scrollbar-thin"
          )}
        />
        <Button
          onClick={handleSend}
          disabled={!hasContent || disabled}
          size="icon"
          className={cn(
            "h-9 w-9 shrink-0 rounded-full transition-all",
            hasContent
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        dyne can make mistakes. Check important info.
      </p>
    </div>
  );
}
