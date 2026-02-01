import { Crown, AlertTriangle, Users } from "lucide-react";

interface CustomerIntelCardProps {
  data: Record<string, any>;
}

const TIER_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  VIP: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "text-amber-500" },
  LOYAL: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: "text-blue-500" },
  NEW: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: "text-emerald-500" },
  REGULAR: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", icon: "text-gray-500" },
  AT_RISK: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", icon: "text-orange-500" },
  LOST: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: "text-red-500" },
};

const DEFAULT_TIER = { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", icon: "text-gray-500" };

export function CustomerIntelCard({ data }: CustomerIntelCardProps) {
  const overview = data?.overview || {};
  const tiers = data?.tiers || {};
  const vips = data?.vip_customers || [];
  const atRisk = data?.at_risk_customers || [];

  const tierOrder = ["VIP", "LOYAL", "NEW", "REGULAR", "AT_RISK", "LOST"];
  const sortedTiers = tierOrder.filter((t) => tiers[t]);

  return (
    <div className="mt-3 space-y-3">
      {/* Overview */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-gray-200 bg-white p-2.5 text-center">
          <p className="text-[10px] font-medium text-gray-500 uppercase">Customers</p>
          <p className="text-lg font-semibold text-gray-900">{(overview.total_customers || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-2.5 text-center">
          <p className="text-[10px] font-medium text-gray-500 uppercase">Top 20% Revenue</p>
          <p className="text-lg font-semibold text-gray-900">{overview.top_20pct_revenue_share || 0}%</p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-2.5 text-center">
          <p className="text-[10px] font-medium text-orange-600 uppercase">At Risk</p>
          <p className="text-lg font-semibold text-orange-700">{(overview.at_risk_count || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Tier Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Users className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs font-semibold text-gray-600 uppercase">Customer Tiers</span>
        </div>
        <div className="space-y-1.5">
          {sortedTiers.map((tier) => {
            const t = tiers[tier];
            const colors = TIER_COLORS[tier] || DEFAULT_TIER;
            const total = overview.total_customers || 1;
            const pct = Math.round((t.count / total) * 100);
            return (
              <div key={tier} className="flex items-center gap-2">
                <span className={`text-[10px] font-bold w-16 ${colors.text}`}>{tier}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors.bg} ${colors.border} border`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 w-20 text-right">
                  {t.count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* VIP + At Risk side by side */}
      <div className="grid grid-cols-2 gap-2">
        {/* VIPs */}
        {vips.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
            <div className="flex items-center gap-1 mb-2">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700 uppercase">Top VIPs</span>
            </div>
            <div className="space-y-1.5">
              {vips.slice(0, 4).map((v: any, i: number) => (
                <div key={i} className="text-xs">
                  <span className="text-gray-600">...{(v.customer_id || "").slice(-4)}</span>
                  <span className="text-gray-400 mx-1">|</span>
                  <span className="font-medium text-gray-800">{v.total_orders} orders</span>
                  <div className="text-amber-700 font-medium">EGP {Math.round(v.total_spend).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* At Risk */}
        {atRisk.length > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-3">
            <div className="flex items-center gap-1 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-semibold text-red-600 uppercase">At Risk</span>
            </div>
            <div className="space-y-1.5">
              {atRisk.slice(0, 4).map((a: any, i: number) => (
                <div key={i} className="text-xs">
                  <span className="text-gray-600">...{(a.customer_id || "").slice(-4)}</span>
                  <span className="text-gray-400 mx-1">|</span>
                  <span className="text-red-500 font-medium">{a.days_since_last}d ago</span>
                  <div className="text-gray-700">EGP {Math.round(a.total_spend).toLocaleString()} lifetime</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
