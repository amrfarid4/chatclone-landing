import { KPICard } from "./KPICard";
import { AlertTriangle, Clock, TrendingUp } from "lucide-react";

interface DailyBriefCardProps {
  data: Record<string, any>;
}

function formatDataDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DailyBriefCard({ data }: DailyBriefCardProps) {
  const kpis = data?.yesterday_kpis || {};
  const deltas = data?.deltas || {};

  const dataDate = data?.date || data?.data_as_of;
  const isStale = (() => {
    if (!dataDate) return false;
    const dataDay = new Date(dataDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - dataDay.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 1;
  })();

  return (
    <div className="mt-3 space-y-3">
      {/* Data freshness badge */}
      {dataDate && (
        <div className="opacity-0 animate-fade-in-up flex items-center gap-1.5 text-[11px] text-muted-foreground" style={{ animationDelay: "0ms" }}>
          <Clock className="h-3 w-3" />
          <span>Data through {formatDataDate(dataDate)}</span>
          {isStale && <span className="text-warning font-medium">&middot; Updating</span>}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <KPICard
            label="Revenue"
            value={Math.round(kpis.gmv || 0)}
            prefix="EGP "
            delta={deltas.gmv_gross?.change_pct}
          />
        </div>
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "250ms" }}>
          <KPICard
            label="Orders"
            value={kpis.orders || 0}
            delta={deltas.orders_success?.change_pct}
          />
        </div>
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "350ms" }}>
          <KPICard
            label="Avg Order"
            value={Math.round(kpis.aov || 0)}
            prefix="EGP "
            delta={deltas.aov?.change_pct}
          />
        </div>
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "450ms" }}>
          <KPICard
            label="Approval"
            value={`${kpis.approval_rate || 0}%`}
            delta={deltas.approval_rate_count?.change_pct}
          />
        </div>
      </div>

      {/* Week-to-date pace */}
      {data?.wtd_pace && (
        <div className="opacity-0 animate-fade-in-up rounded-xl bg-info-muted border border-info/20 p-3 shadow-depth-1" style={{ animationDelay: "550ms" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-info" />
            <span className="text-xs font-semibold text-info uppercase">Week-to-Date</span>
          </div>
          <p className="text-sm text-foreground">
            <span className="font-semibold">EGP {Math.round(data.wtd_pace.current_gmv).toLocaleString()}</span>
            {" "}from {data.wtd_pace.current_orders} orders
            {data.wtd_pace.gmv_change_pct != null && (
              <span className={data.wtd_pace.gmv_change_pct >= 0 ? "text-success" : "text-destructive"}>
                {" "}({data.wtd_pace.gmv_change_pct >= 0 ? "+" : ""}{data.wtd_pace.gmv_change_pct}% vs last week)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Anomalies */}
      {data?.anomalies?.length > 0 && (
        <div className="opacity-0 animate-fade-in-up rounded-xl bg-warning-muted border border-warning/20 p-3 shadow-depth-1" style={{ animationDelay: "700ms" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs font-semibold text-warning uppercase">Item Alerts</span>
          </div>
          <div className="space-y-1">
            {data.anomalies.slice(0, 4).map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-foreground capitalize truncate max-w-[60%]">{a.item}</span>
                <span className={`font-medium ${a.direction === "up" ? "text-success" : "text-destructive"}`}>
                  {a.direction === "up" ? "+" : ""}{Math.round(a.change_pct)}% ({a.yesterday_qty} units)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
