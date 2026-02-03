import dyneEmblem from "@/assets/dyne-emblem.png";

export function LoadingIndicator() {
  return (
    <div
      className="flex justify-start animate-fade-in"
      role="status"
      aria-label="Generating response"
    >
      <div className="flex items-start gap-3 max-w-[85%]">
        {/* Dyne emblem with subtle pulse */}
        <img
          src={dyneEmblem}
          alt="dyne"
          className="h-8 w-8 shrink-0 rounded-xl shadow-depth-1 animate-pulse-soft"
        />

        {/* Premium "Thinking" bubble */}
        <div className="rounded-3xl border border-chat-ai-border bg-chat-ai-bubble px-4 py-3 text-chat-ai-foreground shadow-depth-1">
          <div className="flex items-center gap-3">
            {/* Bouncing dots - ChatGPT style */}
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full bg-primary animate-thinking-dot"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">Thinking</span>
          </div>
        </div>
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">Loading response, please wait</span>
    </div>
  );
}
