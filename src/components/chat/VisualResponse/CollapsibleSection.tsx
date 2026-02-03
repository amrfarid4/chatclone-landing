import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  badge?: string | number;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  delay?: number;
}

/**
 * Collapsible Section - Expandable content area for progressive disclosure
 * Features:
 * - Smooth expand/collapse animation
 * - Icon + title header
 * - Optional badge (count indicator)
 * - Accessible (keyboard navigable)
 */
export function CollapsibleSection({
  title,
  icon,
  badge,
  children,
  defaultOpen = true,
  className,
  delay = 300,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        "shadow-depth-1 opacity-0 animate-slide-up-fade",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Header - clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3",
          "text-left transition-colors duration-200",
          "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          isOpen && "border-b border-border/50"
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {/* Expand/collapse chevron */}
          <span className="text-muted-foreground transition-transform duration-200">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>

          {/* Icon */}
          {icon && (
            <span className="text-primary">{icon}</span>
          )}

          {/* Title */}
          <span className="text-sm font-medium text-foreground">{title}</span>

          {/* Badge */}
          {badge !== undefined && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
      </button>

      {/* Content - animated */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

interface InsightsListProps {
  insights: Array<{
    text: string;
    icon?: string;
    type?: "info" | "warning" | "success" | "highlight";
  }>;
  className?: string;
}

/**
 * Insights List - Displays bullet points with type-based styling
 */
export function InsightsList({ insights, className }: InsightsListProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <ul className={cn("space-y-2", className)}>
      {insights.map((insight, index) => (
        <li
          key={index}
          className={cn(
            "flex items-start gap-2 text-sm",
            "opacity-0 animate-fade-in"
          )}
          style={{ animationDelay: `${400 + index * 50}ms`, animationFillMode: "forwards" }}
        >
          {/* Icon or bullet */}
          <span className={cn(
            "shrink-0 mt-0.5",
            insight.type === "warning" ? "text-warning" :
            insight.type === "success" ? "text-success" :
            insight.type === "highlight" ? "text-primary" :
            "text-muted-foreground"
          )}>
            {insight.icon || "•"}
          </span>

          {/* Text */}
          <span className={cn(
            "text-foreground",
            insight.type === "highlight" && "font-medium"
          )}>
            {insight.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

interface MenuEngListProps {
  menuEng: Array<{
    category: "STAR" | "PLOWHORSE" | "PUZZLE" | "DOG";
    items: string[];
  }>;
  className?: string;
}

const MENU_ENG_CONFIG = {
  STAR: {
    icon: "⭐",
    label: "Stars",
    description: "High volume + High margin",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  PLOWHORSE: {
    icon: "🐴",
    label: "Plowhorses",
    description: "High volume + Low margin",
    color: "text-info",
    bgColor: "bg-info/10",
  },
  PUZZLE: {
    icon: "🧩",
    label: "Puzzles",
    description: "Low volume + High margin",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  DOG: {
    icon: "🐕",
    label: "Dogs",
    description: "Low volume + Low margin",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

/**
 * Menu Engineering List - Displays items by category with visual indicators
 */
export function MenuEngList({ menuEng, className }: MenuEngListProps) {
  if (!menuEng || menuEng.length === 0) return null;

  // Sort by priority: STAR > PLOWHORSE > PUZZLE > DOG
  const priorityOrder = ["STAR", "PLOWHORSE", "PUZZLE", "DOG"];
  const sorted = [...menuEng].sort(
    (a, b) => priorityOrder.indexOf(a.category) - priorityOrder.indexOf(b.category)
  );

  return (
    <div className={cn("space-y-2", className)}>
      {sorted.map((category, index) => {
        const config = MENU_ENG_CONFIG[category.category];

        return (
          <div
            key={category.category}
            className={cn(
              "flex items-start gap-3 p-2 rounded-lg transition-colors",
              config.bgColor,
              "opacity-0 animate-slide-up-fade"
            )}
            style={{ animationDelay: `${400 + index * 100}ms`, animationFillMode: "forwards" }}
          >
            {/* Icon */}
            <span className="text-lg shrink-0">{config.icon}</span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className={cn("text-sm font-medium", config.color)}>
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {config.description}
                </span>
              </div>
              <p className="text-sm text-foreground mt-0.5 truncate">
                {category.items.join(", ")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface RecommendationsListProps {
  recommendations: Array<{
    index: number;
    text: string;
    impact?: string;
  }>;
  className?: string;
}

/**
 * Recommendations List - Displays actionable items with impact estimates
 */
export function RecommendationsList({ recommendations, className }: RecommendationsListProps) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {recommendations.map((rec, idx) => (
        <div
          key={rec.index}
          className={cn(
            "flex gap-3 p-3 rounded-lg border border-border bg-card/50",
            "hover:bg-muted/30 transition-colors",
            "opacity-0 animate-slide-up-fade"
          )}
          style={{ animationDelay: `${400 + idx * 100}ms`, animationFillMode: "forwards" }}
        >
          {/* Number badge */}
          <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
            {rec.index}
          </span>

          {/* Content */}
          <div className="flex-1">
            <p className="text-sm text-foreground">{rec.text}</p>
            {rec.impact && (
              <p className="mt-1 text-xs text-success font-medium">
                Projected: {rec.impact}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
