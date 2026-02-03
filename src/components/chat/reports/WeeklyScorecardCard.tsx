import { KPICard } from "./KPICard";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";

interface WeeklyScorecardCardProps {
  data: Record<string, any>;
}

export function WeeklyScorecardCard({ data }: WeeklyScorecardCardProps) {
  const kpis = data?.this_week_kpis || {};
  const deltas = data?.deltas || {};
  const movers = data?.top_movers || { gainers: [], losers: [] };
  const dayPattern = data?.day_pattern || [];
  const peakHour = data?.peak_hour;

  const maxDayGmv = Math.max(...dayPattern.map((d: any) => d.gmv || 0), 1);

  return (
    <div className="mt-3 space-y-3">
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
          label="Customers"
          value={kpis.unique_customers || 0}
          delta={deltas.unique_customers?.change_pct}
        />
      </div>

      {/* Top Movers */}
      {(movers.gainers?.length > 0 || movers.losers?.length > 0) && (
        <div className="grid grid-cols-2 gap-2">
          {/* Gainers */}
          <div className="rounded-xl bg-success-muted border border-success/20 p-3 shadow-depth-1">
            <div className="flex items-center gap-1 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              <span className="text-xs font-semibold text-success uppercase">Gainers</span>
            </div>
            <div className="space-y-1.5">
              {movers.gainers.slice(0, 4).map((g: any, i: number) => (
                <div key={i} className="text-xs">
                  <span className="text-foreground capitalize">{g.item}</span>
                  <div className="text-success font-medium">+{g.change} units</div>
                </div>
              ))}
            </div>
          </div>

          {/* Losers */}
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 shadow-depth-1">
            <div className="flex items-center gap-1 mb-2">
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs font-semibold text-destructive uppercase">Needs Attention</span>
            </div>
            <div className="space-y-1.5">
              {movers.losers.slice(0, 4).map((l: any, i: number) => (
                <div key={i} className="text-xs">
                  <span className="text-foreground capitalize">{l.item}</span>
                  <div className="text-destructive font-medium">{l.change} units</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Day Pattern + Peak Hour */}
      <div className="flex gap-2">
        {/* Day Pattern Bar Chart */}
        {dayPattern.length > 0 && (
          <div className="flex-1 rounded-xl border border-border bg-card p-3 shadow-depth-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Daily Pattern</span>
            <div className="mt-2 flex items-end gap-1 h-12">
              {dayPattern.map((d: any, i: number) => {
                const height = Math.max((d.gmv / maxDayGmv) * 100, 8);
                const dayName = new Date(d.date).toLocaleDateString("en", { weekday: "short" });
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className="w-full rounded-t bg-primary min-h-[3px] transition-all duration-200 hover:bg-primary/80"
                      style={{ height: `${height}%` }}
                      title={`${dayName}: ${d.orders} orders, EGP ${Math.round(d.gmv).toLocaleString()}`}
                    />
                    <span className="text-[9px] text-muted-foreground">{dayName.charAt(0)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Peak Hour */}
        {peakHour && (
          <div className="rounded-xl border border-border bg-card p-3 min-w-[100px] shadow-depth-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Peak Hour</span>
            <div className="mt-1 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold text-foreground">{peakHour.hour}:00</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{peakHour.orders} orders</p>
          </div>
        )}
      </div>
    </div>
  );
}
