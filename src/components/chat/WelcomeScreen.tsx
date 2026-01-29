import { SuggestedPrompt } from "@/types/chat";
import { cn } from "@/lib/utils";

interface WelcomeScreenProps {
  prompts: SuggestedPrompt[];
  onSelectPrompt: (prompt: string) => void;
}

export function WelcomeScreen({ prompts, onSelectPrompt }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="max-w-2xl text-center animate-fade-in-up">
        {/* Logo/Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <span className="text-3xl">✨</span>
        </div>

        {/* Greeting */}
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
          How can I help you today?
        </h1>
        <p className="mb-8 text-muted-foreground">
          Choose a suggestion below or type your own message to get started.
        </p>

        {/* Suggested Prompts Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt, index) => (
            <button
              key={prompt.id}
              onClick={() => onSelectPrompt(prompt.title)}
              className={cn(
                "group rounded-xl border border-border bg-card p-4 text-left transition-all duration-200",
                "hover:border-primary/30 hover:bg-accent hover:shadow-md",
                "focus:outline-none focus:ring-2 focus:ring-primary/20"
              )}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <div className="mb-2 text-2xl">{prompt.icon}</div>
              <h3 className="mb-1 font-medium text-foreground group-hover:text-primary transition-colors">
                {prompt.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {prompt.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
