import { DeltaIndicator } from "./DeltaIndicator";

interface KPICardProps {
  label: string;
  value: string | number;
  delta?: number | null;
  prefix?: string;
}

export function KPICard({ label, value, delta, prefix = "" }: KPICardProps) {
  const formatted = typeof value === "number"
    ? `${prefix}${value.toLocaleString()}`
    : `${prefix}${value}`;

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-depth-1 transition-all duration-200 hover:shadow-depth-2 hover:border-border/80 hover:-translate-y-0.5">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{formatted}</p>
      {delta !== undefined && (
        <div className="mt-1">
          <DeltaIndicator value={delta} />
        </div>
      )}
    </div>
  );
}
