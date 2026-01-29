import { SuggestedPrompt } from "@/types/chat";
import { cn } from "@/lib/utils";

interface WelcomeScreenProps {
  prompts: SuggestedPrompt[];
  onSelectPrompt: (prompt: string) => void;
}

export function WelcomeScreen({ prompts, onSelectPrompt }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Centered heading - ChatGPT style */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            What can I help you with?
          </h1>
        </div>

        {/* Prompt cards - 2x3 grid on desktop, stack on mobile */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt, index) => (
            <button
              key={prompt.id}
              onClick={() => onSelectPrompt(prompt.title)}
              className={cn(
                "group flex flex-col items-start gap-1 rounded-2xl border border-border bg-card p-4",
                "text-left transition-all duration-200",
                "hover:border-primary/30 hover:bg-accent hover:shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-xl mb-1">{prompt.icon}</span>
              <span className="font-medium text-sm text-foreground">
                {prompt.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {prompt.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
