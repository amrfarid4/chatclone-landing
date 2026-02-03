import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DeltaIndicatorProps {
  value: number | null | undefined;
  suffix?: string;
}

export function DeltaIndicator({ value, suffix = "%" }: DeltaIndicatorProps) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-muted-foreground/60">n/a</span>;
  }

  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-success">
        <TrendingUp className="h-3 w-3" />
        +{value}{suffix}
      </span>
    );
  }

  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-destructive">
        <TrendingDown className="h-3 w-3" />
        {value}{suffix}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground/60">
      <Minus className="h-3 w-3" />
      0{suffix}
    </span>
  );
}
