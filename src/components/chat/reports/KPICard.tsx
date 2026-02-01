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
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{formatted}</p>
      {delta !== undefined && (
        <div className="mt-1">
          <DeltaIndicator value={delta} />
        </div>
      )}
    </div>
  );
}
