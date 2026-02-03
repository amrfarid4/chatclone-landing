import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KPICard } from "@/lib/responseParser";

interface KPICardGridProps {
  cards: KPICard[];
  className?: string;
}

/**
 * KPI Card Grid - Displays metrics in visual cards with trend indicators
 * Features:
 * - Animated count-up effect (via CSS)
 * - Staggered fade-in animation
 * - Color-coded trend arrows
 * - Responsive grid layout
 */
export function KPICardGrid({ cards, className }: KPICardGridProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <div
      className={cn(
        "grid gap-3",
        cards.length === 2 ? "grid-cols-2" :
        cards.length === 3 ? "grid-cols-3" :
        cards.length >= 4 ? "grid-cols-2 md:grid-cols-4" :
        "grid-cols-1",
        className
      )}
    >
      {cards.map((card, index) => (
        <KPICardItem
          key={`${card.label}-${index}`}
          card={card}
          delay={index * 100}
        />
      ))}
    </div>
  );
}

interface KPICardItemProps {
  card: KPICard;
  delay: number;
}

function KPICardItem({ card, delay }: KPICardItemProps) {
  const formattedValue = formatValue(card.value, card.unit);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card p-4",
        "shadow-depth-1 hover:shadow-depth-2 transition-all duration-200",
        "opacity-0 animate-slide-up-fade"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Value */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground tabular-nums animate-count-up">
          {formattedValue}
        </span>
        {card.unit && card.unit !== "EGP" && (
          <span className="text-sm text-muted-foreground">{card.unit}</span>
        )}
      </div>

      {/* Label */}
      <p className="mt-1 text-sm text-muted-foreground">{card.label}</p>

      {/* Trend indicator */}
      {card.trend && (
        <div className={cn(
          "mt-2 flex items-center gap-1 text-xs font-medium",
          card.trend.direction === "up" ? "text-success" :
          card.trend.direction === "down" ? "text-destructive" :
          "text-muted-foreground"
        )}>
          {card.trend.direction === "up" ? (
            <TrendingUp className="h-3 w-3" />
          ) : card.trend.direction === "down" ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <Minus className="h-3 w-3" />
          )}
          <span>
            {card.trend.direction === "up" ? "+" : card.trend.direction === "down" ? "-" : ""}
            {card.trend.value}%
          </span>
          {card.trend.label && (
            <span className="text-muted-foreground/70">{card.trend.label}</span>
          )}
        </div>
      )}

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/5 pointer-events-none" />
    </div>
  );
}

/**
 * Format value with appropriate number formatting
 */
function formatValue(value: string | number, unit?: string): string {
  if (typeof value === "string") return value;

  // Format large numbers
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  // Add EGP prefix for currency
  if (unit === "EGP") {
    return `${value.toLocaleString()} EGP`;
  }

  // Percentage
  if (unit === "%") {
    return `${value.toFixed(1)}%`;
  }

  return value.toLocaleString();
}
