import { cn } from "@/lib/utils";

export function LoadingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="flex items-start gap-3 max-w-[85%]">
        {/* Dyne logo - teal circle */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          D
        </div>
        
        {/* Loading bubble */}
        <div className="rounded-3xl border border-chat-ai-border bg-chat-ai-bubble px-4 py-3 text-chat-ai-foreground">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Analyzing your data</span>
            <span className="flex gap-1 ml-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-loading-dot" style={{ animationDelay: "0s" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-loading-dot" style={{ animationDelay: "0.2s" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-loading-dot" style={{ animationDelay: "0.4s" }} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
