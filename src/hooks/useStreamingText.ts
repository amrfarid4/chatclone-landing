import { useState, useEffect, useRef } from "react";

interface UseStreamingTextOptions {
  text: string;
  speed?: number; // ms per word
  enabled?: boolean;
}

interface UseStreamingTextReturn {
  displayedText: string;
  isComplete: boolean;
}

/**
 * Hook for simulating streaming text effect (word-by-word reveal)
 * Used when the backend doesn't support real streaming but we want
 * the ChatGPT-style text appearance effect.
 */
export function useStreamingText({
  text,
  speed = 25,
  enabled = true,
}: UseStreamingTextOptions): UseStreamingTextReturn {
  const [displayedText, setDisplayedText] = useState(enabled ? "" : text);
  const [isComplete, setIsComplete] = useState(!enabled);
  const indexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If streaming is disabled, show full text immediately
    if (!enabled) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    // Reset state for new text
    setDisplayedText("");
    setIsComplete(false);
    indexRef.current = 0;

    // Split text into words while preserving whitespace and newlines
    const words = text.split(/(\s+)/);

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (indexRef.current < words.length) {
        setDisplayedText((prev) => prev + words[indexRef.current]);
        indexRef.current++;
      } else {
        setIsComplete(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, speed, enabled]);

  return { displayedText, isComplete };
}
