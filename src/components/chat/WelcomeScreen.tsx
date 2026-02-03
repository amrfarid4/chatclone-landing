import { cn } from "@/lib/utils";
import { CalendarDays, TrendingUp, Lightbulb } from "lucide-react";
import dyneEmblem from "@/assets/dyne-emblem.png";

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

const HERO_PROMPTS = [
  {
    id: "yesterday",
    icon: CalendarDays,
    label: "What happened yesterday?",
    description: "Quick rundown of orders, revenue & what moved",
  },
  {
    id: "month",
    icon: TrendingUp,
    label: "How's the month looking?",
    description: "Month-to-date performance vs last month",
  },
  {
    id: "opportunities",
    icon: Lightbulb,
    label: "Spot any opportunities?",
    description: "Menu tweaks, promos & revenue plays to try",
  },
];

export function WelcomeScreen({ onSelectPrompt }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl space-y-8">
        {/* Greeting */}
        <div className="text-center opacity-0 animate-fade-in-up">
          <img
            src={dyneEmblem}
            alt="dyne"
            className="h-14 w-14 mx-auto mb-4 rounded-2xl shadow-depth-2 animate-pulse-soft"
          />
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            Hey — what do you want to dig into?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick one to get started, or type anything below
          </p>
        </div>

        {/* 3 Hero Prompt Buttons */}
        <div className="flex flex-col gap-3">
          {HERO_PROMPTS.map((prompt, index) => (
            <button
              key={prompt.id}
              onClick={() => onSelectPrompt(prompt.label)}
              className={cn(
                "group flex items-center gap-4 rounded-2xl border border-border bg-card p-5",
                "text-left transition-all duration-200",
                "hover:border-primary/40 hover:bg-accent hover:-translate-y-0.5",
                "shadow-depth-1 hover:shadow-depth-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "active:scale-[0.98]",
                "opacity-0 animate-fade-in-up"
              )}
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-200">
                <prompt.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-base text-foreground group-hover:text-primary transition-colors">
                  {prompt.label}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {prompt.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Keyboard shortcut hint */}
        <p className="text-center text-xs text-muted-foreground/60 opacity-0 animate-fade-in" style={{ animationDelay: "600ms" }}>
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">Enter</kbd> to send your message
        </p>
      </div>
    </div>
  );
}
