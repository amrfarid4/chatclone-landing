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
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Clock className="h-3 w-3" />
          <span>Data through {formatDataDate(dataDate)}</span>
          {isStale && <span className="text-amber-500 font-medium">&middot; Updating</span>}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-2">
        <KPICard
          label="Revenue"
          value={Math.round(kpis.gmv || 0)}
          prefix="EGP "
          delta={deltas.gmv_gross?.change_pct}
        />
        <KPICard
          label="Orders"
          value={kpis.orders || 0}
          delta={deltas.orders_success?.change_pct}
        />
        <KPICard
          label="Avg Order"
          value={Math.round(kpis.aov || 0)}
          prefix="EGP "
          delta={deltas.aov?.change_pct}
        />
        <KPICard
          label="Approval"
          value={`${kpis.approval_rate || 0}%`}
          delta={deltas.approval_rate_count?.change_pct}
        />
      </div>

      {/* Week-to-date pace */}
      {data?.wtd_pace && (
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 uppercase">Week-to-Date</span>
          </div>
          <p className="text-sm text-blue-800">
            <span className="font-semibold">EGP {Math.round(data.wtd_pace.current_gmv).toLocaleString()}</span>
            {" "}from {data.wtd_pace.current_orders} orders
            {data.wtd_pace.gmv_change_pct != null && (
              <span className={data.wtd_pace.gmv_change_pct >= 0 ? "text-emerald-600" : "text-red-500"}>
                {" "}({data.wtd_pace.gmv_change_pct >= 0 ? "+" : ""}{data.wtd_pace.gmv_change_pct}% vs last week)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Anomalies */}
      {data?.anomalies?.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700 uppercase">Item Alerts</span>
          </div>
          <div className="space-y-1">
            {data.anomalies.slice(0, 4).map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-700 capitalize truncate max-w-[60%]">{a.item}</span>
                <span className={`font-medium ${a.direction === "up" ? "text-emerald-600" : "text-red-500"}`}>
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
