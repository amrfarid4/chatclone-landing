import { useMemo } from "react";
import { KPICard } from "./KPICard";
import { AlertTriangle, TrendingUp, Lightbulb, CheckCircle } from "lucide-react";

interface ParsedBriefCardProps {
  content: string;
}

interface ParsedKPI {
  label: string;
  value: number;
  unit: string;
  delta?: number;
  direction?: "up" | "down";
}

interface ParsedAlert {
  item: string;
  current: number;
  avg: number;
  changePct: number;
  direction: "up" | "down";
  action?: string;
}

interface ParsedData {
  headline?: string;
  kpis: ParsedKPI[];
  alerts: ParsedAlert[];
  wtdSummary?: string;
  recommendation?: string;
}

/**
 * Parse Brain API text response into structured data
 */
function parseTextResponse(content: string): ParsedData {
  const result: ParsedData = {
    kpis: [],
    alerts: [],
  };

  // Extract headline
  const headlineMatch = content.match(/HEADLINE:\s*(.+?)(?=\n|$)/i);
  if (headlineMatch) {
    result.headline = headlineMatch[1].trim();
  }

  // Extract KPIs from "THE NUMBERS" section
  const numbersMatch = content.match(/THE NUMBERS[^:]*:\s*\n((?:[•\-\*📊].+\n?)+)/im);
  if (numbersMatch) {
    const lines = numbersMatch[1].split('\n').filter(l => l.trim());

    for (const line of lines) {
      // Match: "• 📊 GMV: 32,195 EGP → ↑0.5%" or "• Orders: 17 ↓29.2%"
      const kpiMatch = line.match(/[•\-\*]\s*(?:📊)?\s*([^:]+?):\s*([\d,]+(?:\.\d+)?)\s*(EGP|%|units?)?\s*(?:→)?\s*([↑↓])?\s*([+-]?\d+(?:\.\d+)?%?)?/i);

      if (kpiMatch) {
        const label = kpiMatch[1].trim();
        const value = parseFloat(kpiMatch[2].replace(/,/g, ''));
        const unit = kpiMatch[3] || '';
        const direction = kpiMatch[4] === '↑' ? 'up' : kpiMatch[4] === '↓' ? 'down' : undefined;
        const deltaStr = kpiMatch[5];
        const delta = deltaStr ? parseFloat(deltaStr.replace('%', '').replace('+', '')) : undefined;

        // Only include recognized KPI metrics
        if (/^(GMV|Revenue|Orders?|AOV|Approval|Split)/i.test(label)) {
          result.kpis.push({
            label: normalizeLabel(label),
            value,
            unit,
            delta: direction === 'down' && delta ? -delta : delta,
            direction,
          });
        }
      }
    }
  }

  // Extract alerts from "ALERTS" section
  const alertsMatch = content.match(/ALERTS[^:]*:\s*\n((?:[•\-\*⚠️🔻💡].+\n?)+)/im);
  if (alertsMatch) {
    const lines = alertsMatch[1].split('\n').filter(l => l.trim());

    for (const line of lines) {
      // Match: "• ⚠️ Cappuccino: 3 sold vs 19.1 avg (↓84.3%) → action"
      const alertMatch = line.match(/[•\-\*]\s*(?:⚠️|🔻|💡)?\s*([^:]+?):\s*(\d+)\s*(?:sold|qty|units?)?\s*vs\s*([\d.]+)\s*avg\s*\(([↑↓])?([\d.]+)%?\)\s*(?:→\s*(.+))?/i);

      if (alertMatch) {
        result.alerts.push({
          item: alertMatch[1].trim(),
          current: parseInt(alertMatch[2]),
          avg: parseFloat(alertMatch[3]),
          direction: alertMatch[4] === '↑' ? 'up' : 'down',
          changePct: parseFloat(alertMatch[5]),
          action: alertMatch[6]?.trim(),
        });
      }
    }
  }

  // Extract WTD summary
  const wtdMatch = content.match(/WEEK SO FAR[^:]*:\s*\n([^]+?)(?=\n[A-Z]|\n\n|$)/im);
  if (wtdMatch) {
    result.wtdSummary = wtdMatch[1].replace(/^[•\-\*]\s*/gm, '').trim();
  }

  // Extract recommendation/play
  const playMatch = content.match(/TODAY'S PLAY[^:]*:\s*\n([^]+?)(?=\n\n|Reply with|$)/im);
  if (playMatch) {
    result.recommendation = playMatch[1].replace(/^[✅🎯]\s*/gm, '').trim();
  }

  return result;
}

function normalizeLabel(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('gmv') || l.includes('revenue')) return 'Revenue';
  if (l.includes('order')) return 'Orders';
  if (l.includes('aov')) return 'Avg Order';
  if (l.includes('approval')) return 'Approval';
  if (l.includes('split')) return 'Split Rate';
  return label;
}

/**
 * Check if content has data worth visualizing
 */
export function hasVisualData(content: string): boolean {
  // Check for key sections that indicate structured data
  return (
    /HEADLINE:/i.test(content) ||
    /THE NUMBERS/i.test(content) ||
    /ALERTS/i.test(content)
  );
}

export function ParsedBriefCard({ content }: ParsedBriefCardProps) {
  const parsed = useMemo(() => parseTextResponse(content), [content]);

  // Only render if we have meaningful data
  if (parsed.kpis.length === 0 && parsed.alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Headline */}
      {parsed.headline && (
        <p className="text-sm font-medium text-foreground leading-relaxed opacity-0 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          {parsed.headline}
        </p>
      )}

      {/* KPI Grid */}
      {parsed.kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {parsed.kpis.slice(0, 4).map((kpi, i) => (
            <div key={kpi.label} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${100 + i * 100}ms` }}>
              <KPICard
                label={kpi.label}
                value={kpi.unit === '%' ? `${kpi.value}%` : Math.round(kpi.value)}
                prefix={kpi.unit === 'EGP' ? 'EGP ' : ''}
                delta={kpi.delta}
              />
            </div>
          ))}
        </div>
      )}

      {/* Week-to-date summary */}
      {parsed.wtdSummary && (
        <div className="opacity-0 animate-fade-in-up rounded-xl bg-info-muted border border-info/20 p-3 shadow-depth-1" style={{ animationDelay: "500ms" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-info" />
            <span className="text-xs font-semibold text-info uppercase">Week-to-Date</span>
          </div>
          <p className="text-sm text-foreground">{parsed.wtdSummary}</p>
        </div>
      )}

      {/* Alerts */}
      {parsed.alerts.length > 0 && (
        <div className="opacity-0 animate-fade-in-up rounded-xl bg-warning-muted border border-warning/20 p-3 shadow-depth-1" style={{ animationDelay: "600ms" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs font-semibold text-warning uppercase">Item Alerts</span>
          </div>
          <div className="space-y-2">
            {parsed.alerts.slice(0, 4).map((alert, i) => (
              <div key={i} className="text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground capitalize truncate max-w-[50%]">{alert.item}</span>
                  <span className={`font-semibold ${alert.direction === 'up' ? 'text-success' : 'text-destructive'}`}>
                    {alert.direction === 'up' ? '+' : '-'}{alert.changePct}%
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {alert.current} vs {alert.avg} avg
                </span>
                {alert.action && (
                  <p className="mt-0.5 text-muted-foreground italic">→ {alert.action}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      {parsed.recommendation && (
        <div className="opacity-0 animate-fade-in-up rounded-xl bg-success-muted border border-success/20 p-3 shadow-depth-1" style={{ animationDelay: "700ms" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-semibold text-success uppercase">Today's Play</span>
          </div>
          <p className="text-sm text-foreground">{parsed.recommendation}</p>
        </div>
      )}
    </div>
  );
}
