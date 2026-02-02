import { useState, useEffect } from "react";

const LOADING_MESSAGES = [
  "Pulling up your numbers...",
  "Checking what sold like crazy yesterday...",
  "Spotting the trends you need to know...",
  "Scanning your menu performance...",
  "Finding the wins (and the misses)...",
  "Your data is almost ready — hang tight...",
  "Doing the math so you don't have to...",
  "Crunching orders, revenue, the whole vibe...",
];

export function BriefLoadingScreen({ fadeOut = false }: { fadeOut?: boolean }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        setFade(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex-1 flex items-center justify-center p-6 transition-opacity duration-300 ${fadeOut ? "opacity-0" : "opacity-100"}`}>
      <div className="w-full max-w-3xl mx-auto">
        {/* Simulated message area matching real brief layout */}
        <div className="flex items-start gap-3">
          {/* Dyne avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold animate-pulse-soft">
            D
          </div>

          <div className="flex-1 space-y-4">
            {/* Text skeleton — greeting lines */}
            <div className="space-y-2">
              <div className="h-3.5 w-3/4 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-3.5 w-1/2 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: "100ms" }} />
              <div className="h-3.5 w-2/3 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: "200ms" }} />
            </div>

            {/* KPI grid skeleton — 2×2 */}
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[72px] rounded-lg border border-gray-200 bg-gray-50 animate-pulse"
                  style={{ animationDelay: `${300 + i * 120}ms` }}
                />
              ))}
            </div>

            {/* WTD pace skeleton */}
            <div
              className="h-16 rounded-lg bg-blue-50/50 border border-blue-100/50 animate-pulse"
              style={{ animationDelay: "780ms" }}
            />

            {/* Rotating loading message */}
            <div className="flex items-center justify-center pt-2">
              <p
                className={`text-sm text-gray-500 transition-opacity duration-300 ${
                  fade ? "opacity-100" : "opacity-0"
                }`}
              >
                {LOADING_MESSAGES[msgIndex]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
