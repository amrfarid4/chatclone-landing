/**
 * Response Parser - Breaks AI responses into structured visual sections
 *
 * Transforms text walls into scannable visual components:
 * - Headlines
 * - KPI Cards (metrics with trends)
 * - Data Tables
 * - Insights (bullet points)
 * - Menu Engineering classifications
 * - Recommendations/Actions
 * - Chart data
 */

// ============================================================================
// Types
// ============================================================================

export interface KPICard {
  label: string;
  value: string | number;
  unit?: string; // EGP, %, units, etc.
  trend?: {
    direction: "up" | "down" | "neutral";
    value: number; // percentage change
    label?: string; // "vs last week"
  };
}

export interface InsightItem {
  text: string;
  icon?: string; // emoji
  type?: "info" | "warning" | "success" | "highlight";
}

export interface MenuEngClass {
  category: "STAR" | "PLOWHORSE" | "PUZZLE" | "DOG";
  items: string[];
}

export interface RecommendationItem {
  index: number;
  text: string;
  impact?: string; // "+EGP 220/day"
}

export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ParsedResponse {
  headline?: string;
  kpiCards?: KPICard[];
  insights?: InsightItem[];
  menuEngineering?: MenuEngClass[];
  recommendations?: RecommendationItem[];
  chartData?: ChartDataPoint[];
  tableData?: TableData;
  sections?: ResponseSection[];
  rawText?: string; // Remaining unstructured text
}

export interface ResponseSection {
  type: "headline" | "kpis" | "chart" | "insights" | "menu" | "recommendations" | "text" | "table";
  title?: string;
  content: unknown;
  order: number;
}

// ============================================================================
// Pattern Matchers
// ============================================================================

const PATTERNS = {
  // Headline patterns
  headline: /^(?:\*\*)?Headline:?\s*(.+?)(?:\*\*)?$/im,
  boldHeadline: /^\*\*([^*\n]+)\*\*$/m,

  // KPI patterns - matches "Revenue: 1,600 EGP" or "Orders: 16 units"
  kpi: /(?:^|\n)\s*[-•*]?\s*(?:🔥|📊|💰|📈|📉)?\s*(Revenue|Orders|GMV|AOV|Units|Customers?|Share|Approval|Discount)(?:\s*Rate)?:\s*(?:EGP\s*)?([\d,]+(?:\.\d+)?)\s*(EGP|%|units?)?/gi,

  // Trend patterns - matches "↑ +12%" or "down -4.9%"
  trend: /([↑↓]|up|down)\s*([+-]?\d+(?:\.\d+)?%?)/gi,

  // Menu engineering classes
  menuClass: /(?:^|\n)\s*[-•*]?\s*(?:⭐|🐴|🧩|🐕)?\s*(STAR|PLOWHORSE|PUZZLE|DOG)(?:\s*\([^)]+\))?:\s*(.+?)(?=\n|$)/gi,

  // Recommendations - numbered list after "Here's what I'd do:"
  recommendationHeader: /(?:Here's what I'd do|Recommendations?|Actions?|What I'd recommend):\s*\n?/i,
  numberedItem: /^\s*(\d+)\.\s+(.+?)(?:\n|$)/gm,

  // Bullet points / insights
  bulletPoint: /^[-•*]\s+(.+?)$/gm,

  // Section headers
  sectionHeader: /^(?:#{1,3}\s+)?(?:📊|🔥|💡|📈|⚠️)?\s*\*?\*?([^*\n:]+?)(?:\s*\([^)]+\))?\*?\*?\s*:?\s*$/gm,

  // Data table (markdown format)
  markdownTable: /\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/g,

  // Top items list pattern
  topItemsList: /(?:Top\s+\d+|Top\s+items?|Best\s+sellers?|Highest)\s*(?:by|in)?\s*(\w+)?/i,

  // Item with value pattern
  itemWithValue: /[-•*]\s*(?:🔥|⭐|🧩|🐕)?\s*([^:]+?):\s*([\d,]+)\s*(EGP|units?|%|orders?)?(?:\s*\|)?/gi,
};

// ============================================================================
// Parser Functions
// ============================================================================

/**
 * Extract headline from response
 */
function extractHeadline(text: string): { headline?: string; remainingText: string } {
  // Try explicit "Headline:" pattern
  let match = text.match(PATTERNS.headline);
  if (match) {
    return {
      headline: match[1].trim(),
      remainingText: text.replace(match[0], "").trim(),
    };
  }

  // Try first bold line as headline
  match = text.match(PATTERNS.boldHeadline);
  if (match && match.index === 0) {
    return {
      headline: match[1].trim(),
      remainingText: text.replace(match[0], "").trim(),
    };
  }

  return { remainingText: text };
}

/**
 * Extract KPI metrics from response
 */
function extractKPIs(text: string): { kpis: KPICard[]; remainingText: string } {
  const kpis: KPICard[] = [];
  let remainingText = text;

  // Find all KPI-like patterns
  const kpiMatches = [...text.matchAll(PATTERNS.kpi)];

  for (const match of kpiMatches) {
    const label = match[1];
    const rawValue = match[2].replace(/,/g, "");
    const unit = match[3] || "";

    const value = parseFloat(rawValue);

    // Look for trend near this KPI
    const contextStart = Math.max(0, (match.index || 0) - 20);
    const contextEnd = Math.min(text.length, (match.index || 0) + match[0].length + 50);
    const context = text.slice(contextStart, contextEnd);

    const trendMatch = context.match(/([↑↓]|up|down)\s*([+-]?\d+(?:\.\d+)?%?)/i);
    let trend: KPICard["trend"] | undefined;

    if (trendMatch) {
      const direction = trendMatch[1].toLowerCase().includes("↑") || trendMatch[1].toLowerCase() === "up"
        ? "up"
        : "down";
      const trendValue = parseFloat(trendMatch[2].replace("%", ""));

      trend = {
        direction,
        value: Math.abs(trendValue),
        label: direction === "up" ? "vs last period" : "vs last period",
      };
    }

    kpis.push({
      label: normalizeKPILabel(label),
      value: isNaN(value) ? rawValue : value,
      unit: normalizeUnit(unit),
      trend,
    });

    // Remove this KPI from text
    remainingText = remainingText.replace(match[0], "");
  }

  return { kpis: kpis.length > 0 ? kpis : [], remainingText: remainingText.trim() };
}

/**
 * Extract menu engineering classifications
 */
function extractMenuEngineering(text: string): { menuEng: MenuEngClass[]; remainingText: string } {
  const menuEng: MenuEngClass[] = [];
  let remainingText = text;

  const matches = [...text.matchAll(PATTERNS.menuClass)];

  for (const match of matches) {
    const category = match[1].toUpperCase() as MenuEngClass["category"];
    const itemsStr = match[2].trim();

    // Split items by comma or "and"
    const items = itemsStr
      .split(/,|\sand\s/)
      .map(item => item.trim())
      .filter(Boolean);

    // Check if we already have this category
    const existing = menuEng.find(m => m.category === category);
    if (existing) {
      existing.items.push(...items);
    } else {
      menuEng.push({ category, items });
    }

    remainingText = remainingText.replace(match[0], "");
  }

  return { menuEng: menuEng.length > 0 ? menuEng : [], remainingText: remainingText.trim() };
}

/**
 * Extract recommendations
 */
function extractRecommendations(text: string): { recommendations: RecommendationItem[]; remainingText: string } {
  const recommendations: RecommendationItem[] = [];
  let remainingText = text;

  // Find the recommendations section
  const headerMatch = text.match(PATTERNS.recommendationHeader);
  if (!headerMatch) {
    return { recommendations: [], remainingText };
  }

  // Get text after the header
  const startIndex = (headerMatch.index || 0) + headerMatch[0].length;
  const afterHeader = text.slice(startIndex);

  // Find numbered items
  const itemMatches = [...afterHeader.matchAll(/^\s*(\d+)\.\s+(.+?)(?=\n\d+\.|\n\n|$)/gms)];

  for (const match of itemMatches) {
    const index = parseInt(match[1]);
    let itemText = match[2].trim();

    // Extract impact if present
    let impact: string | undefined;
    const impactMatch = itemText.match(/(?:Projected|Expected|Estimated)?\s*(?:impact|uplift|revenue)?\s*:?\s*([+-]?\s*(?:EGP\s*)?\d+[^.]*)/i);
    if (impactMatch) {
      impact = impactMatch[1].trim();
    }

    recommendations.push({
      index,
      text: itemText.split(/\n/)[0].trim(), // First line only
      impact,
    });
  }

  // Remove recommendations section from text
  if (recommendations.length > 0) {
    remainingText = text.slice(0, headerMatch.index).trim();
  }

  return { recommendations, remainingText };
}

/**
 * Extract bullet point insights
 */
function extractInsights(text: string): { insights: InsightItem[]; remainingText: string } {
  const insights: InsightItem[] = [];
  let remainingText = text;

  // Find bullet points
  const matches = [...text.matchAll(/^[-•*]\s+(.+?)$/gm)];

  for (const match of matches) {
    let itemText = match[1].trim();

    // Determine type based on emoji or content
    let type: InsightItem["type"] = "info";
    let icon: string | undefined;

    if (itemText.startsWith("🔥")) {
      type = "highlight";
      icon = "🔥";
      itemText = itemText.slice(2).trim();
    } else if (itemText.startsWith("⚠️") || itemText.toLowerCase().includes("warning")) {
      type = "warning";
      icon = "⚠️";
      itemText = itemText.slice(2).trim();
    } else if (itemText.startsWith("✅") || itemText.startsWith("🎯")) {
      type = "success";
      icon = itemText.slice(0, 2);
      itemText = itemText.slice(2).trim();
    }

    insights.push({
      text: itemText,
      icon,
      type,
    });

    remainingText = remainingText.replace(match[0], "");
  }

  return { insights: insights.length > 0 ? insights : [], remainingText: remainingText.trim() };
}

/**
 * Extract chart data from top items lists
 */
function extractChartData(text: string): { chartData: ChartDataPoint[]; remainingText: string } {
  const chartData: ChartDataPoint[] = [];
  let remainingText = text;

  // Look for item + value patterns
  const matches = [...text.matchAll(PATTERNS.itemWithValue)];

  for (const match of matches) {
    const name = match[1].trim();
    const rawValue = match[2].replace(/,/g, "");
    const unit = match[3] || "";

    chartData.push({
      name,
      value: parseFloat(rawValue),
      label: unit,
    });
  }

  return { chartData: chartData.length >= 3 ? chartData : [], remainingText };
}

/**
 * Extract markdown table
 */
function extractTable(text: string): { table?: TableData; remainingText: string } {
  const match = text.match(PATTERNS.markdownTable);
  if (!match) {
    return { remainingText: text };
  }

  const [fullMatch, headerRow, bodyRows] = match;

  const headers = headerRow
    .split("|")
    .map(h => h.trim())
    .filter(Boolean);

  const rows = bodyRows
    .trim()
    .split("\n")
    .map(row =>
      row
        .split("|")
        .map(cell => cell.trim())
        .filter(Boolean)
    );

  return {
    table: { headers, rows },
    remainingText: text.replace(fullMatch, "").trim(),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function normalizeKPILabel(label: string): string {
  const mapping: Record<string, string> = {
    revenue: "Revenue",
    gmv: "Revenue",
    orders: "Orders",
    aov: "Avg Order",
    units: "Units Sold",
    customers: "Customers",
    customer: "Customers",
    share: "Share",
    approval: "Approval",
    discount: "Discount",
  };

  return mapping[label.toLowerCase()] || label;
}

function normalizeUnit(unit: string): string {
  const u = unit.toLowerCase();
  if (u === "egp" || u === "") return "EGP";
  if (u === "%" || u === "percent") return "%";
  if (u.includes("unit")) return "units";
  return unit;
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Parse an AI response into structured visual components
 */
export function parseResponse(content: string): ParsedResponse {
  if (!content || typeof content !== "string") {
    return { rawText: content || "" };
  }

  let text = content;
  const result: ParsedResponse = {};
  const sections: ResponseSection[] = [];
  let order = 0;

  // 1. Extract headline
  const { headline, remainingText: afterHeadline } = extractHeadline(text);
  if (headline) {
    result.headline = headline;
    sections.push({ type: "headline", content: headline, order: order++ });
    text = afterHeadline;
  }

  // 2. Extract KPIs
  const { kpis, remainingText: afterKPIs } = extractKPIs(text);
  if (kpis.length > 0) {
    result.kpiCards = kpis;
    sections.push({ type: "kpis", content: kpis, order: order++ });
    text = afterKPIs;
  }

  // 3. Extract chart data
  const { chartData, remainingText: afterChart } = extractChartData(text);
  if (chartData.length > 0) {
    result.chartData = chartData;
    sections.push({ type: "chart", content: chartData, order: order++ });
    text = afterChart;
  }

  // 4. Extract menu engineering
  const { menuEng, remainingText: afterMenu } = extractMenuEngineering(text);
  if (menuEng.length > 0) {
    result.menuEngineering = menuEng;
    sections.push({ type: "menu", title: "Menu Engineering", content: menuEng, order: order++ });
    text = afterMenu;
  }

  // 5. Extract recommendations
  const { recommendations, remainingText: afterRecs } = extractRecommendations(text);
  if (recommendations.length > 0) {
    result.recommendations = recommendations;
    sections.push({ type: "recommendations", title: "Recommendations", content: recommendations, order: order++ });
    text = afterRecs;
  }

  // 6. Extract insights (bullet points)
  const { insights, remainingText: afterInsights } = extractInsights(text);
  if (insights.length > 0) {
    result.insights = insights;
    sections.push({ type: "insights", title: "What the data says", content: insights, order: order++ });
    text = afterInsights;
  }

  // 7. Extract table
  const { table, remainingText: afterTable } = extractTable(text);
  if (table) {
    result.tableData = table;
    sections.push({ type: "table", content: table, order: order++ });
    text = afterTable;
  }

  // 8. Keep remaining text
  const cleanedText = text.replace(/\n{3,}/g, "\n\n").trim();
  if (cleanedText.length > 50) {
    result.rawText = cleanedText;
    sections.push({ type: "text", content: cleanedText, order: order++ });
  }

  result.sections = sections;

  return result;
}

/**
 * Check if a response has any structured content worth visualizing
 */
export function hasVisualContent(parsed: ParsedResponse): boolean {
  return Boolean(
    parsed.kpiCards?.length ||
    parsed.chartData?.length ||
    parsed.menuEngineering?.length ||
    parsed.recommendations?.length ||
    parsed.tableData
  );
}

/**
 * Get icon for menu engineering category
 */
export function getMenuEngIcon(category: MenuEngClass["category"]): string {
  const icons: Record<MenuEngClass["category"], string> = {
    STAR: "⭐",
    PLOWHORSE: "🐴",
    PUZZLE: "🧩",
    DOG: "🐕",
  };
  return icons[category] || "📊";
}

/**
 * Get color class for menu engineering category
 */
export function getMenuEngColor(category: MenuEngClass["category"]): string {
  const colors: Record<MenuEngClass["category"], string> = {
    STAR: "text-warning",
    PLOWHORSE: "text-info",
    PUZZLE: "text-primary",
    DOG: "text-muted-foreground",
  };
  return colors[category] || "text-foreground";
}
