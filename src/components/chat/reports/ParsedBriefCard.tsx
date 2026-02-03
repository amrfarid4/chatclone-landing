import { useMemo } from "react";
import { parseResponse, hasVisualContent } from "@/lib/responseParser";
import { KPICardGrid } from "../VisualResponse/KPICardGrid";
import { InlineBarChart } from "../VisualResponse/InlineBarChart";
import { CollapsibleSection } from "../VisualResponse/CollapsibleSection";
import { CheckCircle, Lightbulb, BarChart3 } from "lucide-react";

/**
 * Strip markdown markers from text for clean display
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers
    .replace(/\*([^*]+)\*/g, '$1')     // Remove italic markers
    .replace(/`([^`]+)`/g, '$1')       // Remove inline code
    .replace(/^#+\s*/, '')             // Remove heading markers
    .trim();
}

interface ParsedBriefCardProps {
  content: string;
}

/**
 * Check if content has data worth visualizing
 * Uses simple pattern checks for performance
 */
export function hasVisualData(content: string): boolean {
  // Check for key sections that indicate structured data
  return (
    /Headline:/i.test(content) ||
    /THE NUMBERS/i.test(content) ||
    /ALERTS/i.test(content) ||
    /Top\s+\d+/i.test(content) ||
    /Menu engineering/i.test(content) ||
    /What the numbers say/i.test(content) ||
    /📊|⭐|🔥|⚠️/.test(content) ||
    // Check for bullet items with values (Brain API format)
    /[•\-\*]\s*[^:]+:\s*\d+\s*(?:units?|orders?)?\s*=/i.test(content)
  );
}

/**
 * ParsedBriefCard - Transforms text responses into visual cards and charts
 * Uses the main responseParser for robust pattern matching
 */
export function ParsedBriefCard({ content }: ParsedBriefCardProps) {
  const parsed = useMemo(() => parseResponse(content), [content]);

  // Only render if we have meaningful visual data
  if (!hasVisualContent(parsed)) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Headline */}
      {parsed.headline && (
        <p
          className="text-sm font-medium text-foreground leading-relaxed opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0ms" }}
        >
          {stripMarkdown(parsed.headline)}
        </p>
      )}

      {/* KPI Cards Grid */}
      {parsed.kpiCards && parsed.kpiCards.length > 0 && (
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <KPICardGrid cards={parsed.kpiCards} />
        </div>
      )}

      {/* Bar Chart - for top items data */}
      {parsed.chartData && parsed.chartData.length >= 3 && (
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <InlineBarChart
            data={parsed.chartData}
            title="Top Items"
            showValues={true}
          />
        </div>
      )}

      {/* Insights Section */}
      {parsed.insights && parsed.insights.length > 0 && (
        <CollapsibleSection
          title="What the data says"
          icon={<Lightbulb className="h-3.5 w-3.5" />}
          defaultOpen={true}
          delay={300}
        >
          <div className="space-y-2">
            {parsed.insights.slice(0, 5).map((insight, i) => (
              <InsightItem key={i} insight={insight} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Menu Engineering Section */}
      {parsed.menuEngineering && parsed.menuEngineering.length > 0 && (
        <CollapsibleSection
          title="Menu Engineering"
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          defaultOpen={true}
          delay={400}
        >
          <div className="space-y-2">
            {parsed.menuEngineering.map((cat) => (
              <div key={cat.category} className="flex items-start gap-2 text-xs">
                <span className="shrink-0">
                  {cat.category === "STAR" && "⭐"}
                  {cat.category === "PLOWHORSE" && "🐴"}
                  {cat.category === "PUZZLE" && "🧩"}
                  {cat.category === "DOG" && "🐕"}
                </span>
                <div>
                  <span className="font-semibold text-foreground">{cat.category}:</span>{" "}
                  <span className="text-muted-foreground">{cat.items.join(", ")}</span>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Recommendations Section */}
      {parsed.recommendations && parsed.recommendations.length > 0 && (
        <div
          className="opacity-0 animate-fade-in-up rounded-xl bg-success-muted border border-success/20 p-3 shadow-depth-1"
          style={{ animationDelay: "500ms" }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-semibold text-success uppercase">Recommendations</span>
          </div>
          <div className="space-y-2">
            {parsed.recommendations.map((rec) => (
              <div key={rec.index} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-success font-medium shrink-0">{rec.index}.</span>
                  <div>
                    <span className="text-foreground">{rec.text}</span>
                    {rec.impact && (
                      <span className="ml-2 text-xs text-success font-medium">{rec.impact}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface InsightItemProps {
  insight: {
    text: string;
    icon?: string;
    type?: "info" | "warning" | "success" | "highlight";
  };
}

function InsightItem({ insight }: InsightItemProps) {
  const typeStyles = {
    info: "text-muted-foreground",
    warning: "text-warning",
    success: "text-success",
    highlight: "text-primary",
  };

  // Clean the text by stripping markdown markers
  const cleanText = stripMarkdown(insight.text);

  return (
    <div className="flex items-start gap-2 text-xs">
      {insight.icon && <span className="shrink-0">{insight.icon}</span>}
      <span className={typeStyles[insight.type || "info"]}>{cleanText}</span>
    </div>
  );
}
