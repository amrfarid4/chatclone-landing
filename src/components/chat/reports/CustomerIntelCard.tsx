import { Crown, AlertTriangle, Users } from "lucide-react";

interface CustomerIntelCardProps {
  data: Record<string, any>;
}

export function CustomerIntelCard({ data }: CustomerIntelCardProps) {
  const overview = data?.overview || {};
  const tiers = data?.tiers || {};
  const vips = data?.vip_customers || [];
  const atRisk = data?.at_risk_customers || [];

  const tierOrder = ["VIP", "LOYAL", "NEW", "REGULAR", "AT_RISK", "LOST"];
  const sortedTiers = tierOrder.filter((t) => tiers[t]);

  // Semantic tier colors using CSS classes
  const getTierColors = (tier: string) => {
    switch (tier) {
      case "VIP":
        return { bg: "bg-warning-muted", border: "border-warning/30", text: "text-warning", bar: "bg-warning/60" };
      case "LOYAL":
        return { bg: "bg-info-muted", border: "border-info/30", text: "text-info", bar: "bg-info/60" };
      case "NEW":
        return { bg: "bg-success-muted", border: "border-success/30", text: "text-success", bar: "bg-success/60" };
      case "REGULAR":
        return { bg: "bg-muted", border: "border-border", text: "text-muted-foreground", bar: "bg-muted-foreground/40" };
      case "AT_RISK":
        return { bg: "bg-warning-muted", border: "border-warning/30", text: "text-warning", bar: "bg-warning/60" };
      case "LOST":
        return { bg: "bg-destructive/5", border: "border-destructive/30", text: "text-destructive", bar: "bg-destructive/60" };
      default:
        return { bg: "bg-muted", border: "border-border", text: "text-muted-foreground", bar: "bg-muted-foreground/40" };
    }
  };

  return (
    <div className="mt-3 space-y-3">
      {/* Overview */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-card p-2.5 text-center shadow-depth-1 transition-all hover:shadow-depth-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Customers</p>
          <p className="text-lg font-semibold text-foreground">{(overview.total_customers || 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-2.5 text-center shadow-depth-1 transition-all hover:shadow-depth-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Top 20% Revenue</p>
          <p className="text-lg font-semibold text-foreground">{overview.top_20pct_revenue_share || 0}%</p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning-muted p-2.5 text-center shadow-depth-1 transition-all hover:shadow-depth-2">
          <p className="text-[10px] font-medium text-warning uppercase">At Risk</p>
          <p className="text-lg font-semibold text-warning">{(overview.at_risk_count || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Tier Breakdown */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-depth-1">
        <div className="flex items-center gap-1.5 mb-2">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase">Customer Tiers</span>
        </div>
        <div className="space-y-1.5">
          {sortedTiers.map((tier) => {
            const t = tiers[tier];
            const colors = getTierColors(tier);
            const total = overview.total_customers || 1;
            const pct = Math.round((t.count / total) * 100);
            return (
              <div key={tier} className="flex items-center gap-2">
                <span className={`text-[10px] font-bold w-16 ${colors.text}`}>{tier}</span>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors.bar} transition-all duration-300`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-20 text-right">
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
          <div className="rounded-xl bg-warning-muted border border-warning/20 p-3 shadow-depth-1">
            <div className="flex items-center gap-1 mb-2">
              <Crown className="h-3.5 w-3.5 text-warning" />
              <span className="text-xs font-semibold text-warning uppercase">Top VIPs</span>
            </div>
            <div className="space-y-1.5">
              {vips.slice(0, 4).map((v: any, i: number) => (
                <div key={i} className="text-xs">
                  <span className="text-muted-foreground">...{(v.customer_id || "").slice(-4)}</span>
                  <span className="text-muted-foreground/50 mx-1">|</span>
                  <span className="font-medium text-foreground">{v.total_orders} orders</span>
                  <div className="text-warning font-medium">EGP {Math.round(v.total_spend).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* At Risk */}
        {atRisk.length > 0 && (
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 shadow-depth-1">
            <div className="flex items-center gap-1 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs font-semibold text-destructive uppercase">At Risk</span>
            </div>
            <div className="space-y-1.5">
              {atRisk.slice(0, 4).map((a: any, i: number) => (
                <div key={i} className="text-xs">
                  <span className="text-muted-foreground">...{(a.customer_id || "").slice(-4)}</span>
                  <span className="text-muted-foreground/50 mx-1">|</span>
                  <span className="text-destructive font-medium">{a.days_since_last}d ago</span>
                  <div className="text-foreground">EGP {Math.round(a.total_spend).toLocaleString()} lifetime</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
