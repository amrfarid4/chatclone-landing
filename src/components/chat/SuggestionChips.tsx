import { SuggestedPrompt } from "@/types/chat";
import { cn } from "@/lib/utils";

interface SuggestionChipsProps {
  prompts: SuggestedPrompt[];
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export function SuggestionChips({ prompts, onSelectPrompt, disabled }: SuggestionChipsProps) {
  // Show first 4 prompts as compact chips
  const visiblePrompts = prompts.slice(0, 4);

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {visiblePrompts.map((prompt) => (
        <button
          key={prompt.id}
          onClick={() => onSelectPrompt(prompt.title)}
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5",
            "text-xs font-medium text-foreground",
            "transition-all duration-150",
            "hover:border-primary/30 hover:bg-accent hover:shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          <span>{prompt.icon}</span>
          <span className="max-w-[120px] truncate">{prompt.title.replace("?", "")}</span>
        </button>
      ))}
    </div>
  );
}
