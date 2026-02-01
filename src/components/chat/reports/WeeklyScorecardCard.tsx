import { KPICard } from "./KPICard";
import { DeltaIndicator } from "./DeltaIndicator";
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
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
            <div className="flex items-center gap-1 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 uppercase">Gainers</span>
            </div>
            <div className="space-y-1.5">
              {movers.gainers.slice(0, 4).map((g: any, i: number) => (
                <div key={i} className="text-xs">
                  <span className="text-gray-800 capitalize">{g.item}</span>
                  <div className="text-emerald-600 font-medium">+{g.change} units</div>
                </div>
              ))}
            </div>
          </div>

          {/* Losers */}
          <div className="rounded-lg bg-red-50 border border-red-100 p-3">
            <div className="flex items-center gap-1 mb-2">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-semibold text-red-600 uppercase">Needs Attention</span>
            </div>
            <div className="space-y-1.5">
              {movers.losers.slice(0, 4).map((l: any, i: number) => (
                <div key={i} className="text-xs">
                  <span className="text-gray-800 capitalize">{l.item}</span>
                  <div className="text-red-500 font-medium">{l.change} units</div>
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
          <div className="flex-1 rounded-lg border border-gray-200 bg-white p-3">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Daily Pattern</span>
            <div className="mt-2 flex items-end gap-1 h-12">
              {dayPattern.map((d: any, i: number) => {
                const height = Math.max((d.gmv / maxDayGmv) * 100, 8);
                const dayName = new Date(d.date).toLocaleDateString("en", { weekday: "short" });
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className="w-full rounded-t bg-teal-400 min-h-[3px]"
                      style={{ height: `${height}%` }}
                      title={`${dayName}: ${d.orders} orders, EGP ${Math.round(d.gmv).toLocaleString()}`}
                    />
                    <span className="text-[9px] text-gray-400">{dayName.charAt(0)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Peak Hour */}
        {peakHour && (
          <div className="rounded-lg border border-gray-200 bg-white p-3 min-w-[100px]">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Peak Hour</span>
            <div className="mt-1 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-teal-600" />
              <span className="text-lg font-semibold text-gray-900">{peakHour.hour}:00</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">{peakHour.orders} orders</p>
          </div>
        )}
      </div>
    </div>
  );
}
