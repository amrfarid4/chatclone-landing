import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ChartDataPoint } from "@/lib/responseParser";

interface InlineBarChartProps {
  data: ChartDataPoint[];
  title?: string;
  className?: string;
  horizontal?: boolean;
  showValues?: boolean;
  colorByIndex?: boolean;
}

// Color palette for bars
const BAR_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.8)",
  "hsl(var(--primary) / 0.6)",
  "hsl(var(--primary) / 0.4)",
  "hsl(var(--muted-foreground) / 0.5)",
];

/**
 * Inline Bar Chart - Displays ranked items with horizontal bars
 * Uses recharts for interactivity and responsiveness
 */
export function InlineBarChart({
  data,
  title,
  className,
  horizontal = true,
  showValues = true,
  colorByIndex = true,
}: InlineBarChartProps) {
  if (!data || data.length === 0) return null;

  // Sort data by value descending and take top 5
  const sortedData = [...data]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((item, index) => ({
      ...item,
      fill: colorByIndex ? BAR_COLORS[Math.min(index, BAR_COLORS.length - 1)] : BAR_COLORS[0],
    }));

  const maxValue = Math.max(...sortedData.map(d => d.value));

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4",
        "shadow-depth-1 opacity-0 animate-slide-up-fade",
        className
      )}
      style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
    >
      {title && (
        <h4 className="text-sm font-medium text-foreground mb-3">{title}</h4>
      )}

      {horizontal ? (
        <HorizontalBars data={sortedData} maxValue={maxValue} showValues={showValues} />
      ) : (
        <VerticalChart data={sortedData} />
      )}
    </div>
  );
}

interface HorizontalBarsProps {
  data: (ChartDataPoint & { fill: string })[];
  maxValue: number;
  showValues: boolean;
}

/**
 * Simple horizontal bars with CSS animations
 */
function HorizontalBars({ data, maxValue, showValues }: HorizontalBarsProps) {
  return (
    <div className="space-y-2">
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;

        return (
          <div key={item.name} className="group">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-foreground truncate max-w-[60%]">{item.name}</span>
              {showValues && (
                <span className="text-muted-foreground font-medium tabular-nums">
                  {item.value.toLocaleString()} {item.label || ""}
                </span>
              )}
            </div>
            <div className="h-6 bg-muted/50 rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500 ease-out group-hover:brightness-110"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.fill,
                  animation: `bar-grow 0.6s ease-out ${index * 100}ms forwards`,
                  transformOrigin: "left",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface VerticalChartProps {
  data: (ChartDataPoint & { fill: string })[];
}

/**
 * Vertical bar chart using recharts
 */
function VerticalChart({ data }: VerticalChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis hide />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
        />
        <Bar
          dataKey="value"
          radius={[4, 4, 0, 0]}
          animationDuration={600}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint & { fill: string } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-depth-2">
      <p className="text-sm font-medium text-foreground">{data.name}</p>
      <p className="text-sm text-muted-foreground">
        {data.value.toLocaleString()} {data.label || ""}
      </p>
    </div>
  );
}
