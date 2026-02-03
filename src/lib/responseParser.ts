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
// Pattern Matchers - Designed for Brain API response format
// ============================================================================

const PATTERNS = {
  // Headline patterns - matches "HEADLINE: text" or "**Headline:** text"
  headline: /^(?:\*\*)?HEADLINE:?\s*(.+?)(?:\*\*)?$/im,
  boldHeadline: /^\*\*([^*\n]+)\*\*$/m,

  // Section headers like "THE NUMBERS (vs same day last week):" or "ALERTS:"
  sectionHeader: /^([A-Z][A-Z\s]+?)(?:\s*\([^)]+\))?:\s*$/gm,

  // KPI patterns - matches "• GMV: 32,195 EGP ↑ 0.5%" format
  // Expanded to include more metric names from Brain API
  kpiLine: /^[•\-\*]\s*(GMV|Revenue|Orders?|AOV|Units?|Customers?|Share|Approval\s*rate?|Split\s*rate?|Discount|Total|Sales|Avg|Average)s?:\s*([\d,]+(?:\.\d+)?)\s*(EGP|%|units?)?\s*([↑↓])?\s*([+-]?\d+(?:\.\d+)?%?)?/gim,

  // Trend patterns - matches "↑ +12%" or "↓ 29.2%"
  trend: /([↑↓])\s*([+-]?\d+(?:\.\d+)?%?)/g,

  // Menu engineering classes
  menuClass: /(?:^|\n)\s*[-•*]?\s*(?:⭐|🐴|🧩|🐕)?\s*(STAR|PLOWHORSE|PUZZLE|DOG)(?:\s*\([^)]+\))?:\s*(.+?)(?=\n|$)/gi,

  // Recommendations - numbered list after various headers
  recommendationHeader: /(?:Here's what I'd do|Recommendations?|Actions?|What I'd recommend|Next steps?):\s*\n?/i,
  numberedItem: /^\s*(\d+)\.\s+(.+?)(?:\n|$)/gm,

  // Alert/anomaly items - "• Item: X qty vs Y avg ↓ Z%"
  alertItem: /^[•\-\*]\s*([^:]+):\s*(\d+)\s*(?:qty|units?)?\s*vs\s*([\d.]+)\s*avg\s*([↑↓])\s*([\d.]+%?)\s*(?:→\s*(.+))?$/gim,

  // Bullet points / insights
  bulletPoint: /^[-•*]\s+(.+?)$/gm,

  // Data table (markdown format)
  markdownTable: /\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/g,

  // Top items list pattern
  topItemsList: /(?:Top\s+\d+|Top\s+items?|Best\s+sellers?|Highest)\s*(?:by|in)?\s*(\w+)?/i,

  // Item with value pattern for charts
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
 * Handles format: "• GMV: 32,195 EGP ↑ 0.5%"
 */
function extractKPIs(text: string): { kpis: KPICard[]; remainingText: string } {
  const kpis: KPICard[] = [];
  let remainingText = text;

  // Look for "THE NUMBERS" section or similar
  const numbersSection = text.match(/(?:THE NUMBERS|KEY METRICS|METRICS|SUMMARY)[^:]*:\s*\n((?:[•\-\*].+\n?)+)/im);
  const searchText = numbersSection ? numbersSection[1] : text;

  // Find all KPI-like patterns using the new format
  const lines = searchText.split('\n');

  for (const line of lines) {
    // Match format: "• GMV: 32,195 EGP ↑ 0.5%" or "• Orders: 17 ↓ 29.2%"
    const kpiMatch = line.match(/^[•\-\*]\s*([^:]+?):\s*([\d,]+(?:\.\d+)?)\s*(EGP|%|units?)?\s*([↑↓])?\s*([+-]?\d+(?:\.\d+)?%?)?/i);

    if (kpiMatch) {
      const label = kpiMatch[1].trim();
      const rawValue = kpiMatch[2].replace(/,/g, "");
      const unit = kpiMatch[3] || "";
      const trendDir = kpiMatch[4];
      const trendVal = kpiMatch[5];

      const value = parseFloat(rawValue);

      // Build trend object if trend info exists
      let trend: KPICard["trend"] | undefined;
      if (trendDir && trendVal) {
        trend = {
          direction: trendDir === "↑" ? "up" : "down",
          value: Math.abs(parseFloat(trendVal.replace("%", "").replace("+", "").replace("-", ""))),
          label: "vs last period",
        };
      }

      // Only add if it looks like a real KPI metric (not an alert/item)
      const isKPI = /^(GMV|Revenue|Orders?|AOV|Units?|Customers?|Share|Approval|Split|Discount|Total|Sales|Avg)/i.test(label);

      if (isKPI) {
        kpis.push({
          label: normalizeKPILabel(label),
          value: isNaN(value) ? rawValue : value,
          unit: normalizeUnit(unit),
          trend,
        });

        // Remove this line from remaining text
        remainingText = remainingText.replace(line, "");
      }
    }
  }

  // Also remove the "THE NUMBERS" header if we found KPIs
  if (kpis.length > 0 && numbersSection) {
    remainingText = remainingText.replace(/(?:THE NUMBERS|KEY METRICS|METRICS)[^:]*:\s*\n?/im, "");
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
 * Extract alerts from "ALERTS" section
 * Format: "• Cappuccino: 3 qty vs 19.1 avg ↓ 84.3% → check stock..."
 */
function extractAlerts(text: string): { alerts: InsightItem[]; remainingText: string } {
  const alerts: InsightItem[] = [];
  let remainingText = text;

  // Look for ALERTS section
  const alertsSection = text.match(/ALERTS[^:]*:\s*\n((?:[•\-\*].+\n?)+)/im);
  if (!alertsSection) {
    return { alerts: [], remainingText };
  }

  const alertLines = alertsSection[1].split('\n').filter(line => line.trim());

  for (const line of alertLines) {
    // Match format: "• Item: X qty vs Y avg ↓ Z% → action"
    const alertMatch = line.match(/^[•\-\*]\s*([^:]+):\s*(\d+)\s*(?:qty|units?)?\s*vs\s*([\d.]+)\s*avg\s*([↑↓])\s*([\d.]+%?)\s*(?:→\s*(.+))?$/i);

    if (alertMatch) {
      const itemName = alertMatch[1].trim();
      const currentQty = alertMatch[2];
      const avgQty = alertMatch[3];
      const direction = alertMatch[4];
      const changePercent = alertMatch[5];
      const action = alertMatch[6]?.trim() || "";

      const isDown = direction === "↓";

      alerts.push({
        text: `**${itemName}**: ${currentQty} vs ${avgQty} avg (${direction}${changePercent})${action ? ` — ${action}` : ""}`,
        icon: isDown ? "⚠️" : "📈",
        type: isDown ? "warning" : "info",
      });

      remainingText = remainingText.replace(line, "");
    } else if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
      // Fallback: treat as generic alert
      const bulletText = line.replace(/^[•\-\*]\s*/, "").trim();
      if (bulletText) {
        alerts.push({
          text: bulletText,
          icon: "⚠️",
          type: "warning",
        });
        remainingText = remainingText.replace(line, "");
      }
    }
  }

  // Remove ALERTS header
  if (alerts.length > 0) {
    remainingText = remainingText.replace(/ALERTS[^:]*:\s*\n?/im, "");
  }

  return { alerts, remainingText: remainingText.trim() };
}

/**
 * Extract bullet point insights (excluding KPIs and alerts)
 */
function extractInsights(text: string): { insights: InsightItem[]; remainingText: string } {
  const insights: InsightItem[] = [];
  let remainingText = text;

  // Find bullet points that aren't KPIs or alerts
  const matches = [...text.matchAll(/^[-•*]\s+(.+?)$/gm)];

  for (const match of matches) {
    let itemText = match[1].trim();

    // Skip if it looks like a KPI line (has colon followed by number)
    if (/^[^:]+:\s*[\d,]+/.test(itemText)) {
      continue;
    }

    // Skip if it looks like an alert (has "vs avg")
    if (/vs\s*[\d.]+\s*avg/i.test(itemText)) {
      continue;
    }

    // Determine type based on emoji or content
    let type: InsightItem["type"] = "info";
    let icon: string | undefined;

    if (itemText.startsWith("🔥")) {
      type = "highlight";
      icon = "🔥";
      itemText = itemText.slice(2).trim();
    } else if (itemText.startsWith("⚠️") || itemText.toLowerCase().includes("warning") || itemText.toLowerCase().includes("alert")) {
      type = "warning";
      icon = "⚠️";
      if (itemText.startsWith("⚠️")) itemText = itemText.slice(2).trim();
    } else if (itemText.startsWith("✅") || itemText.startsWith("🎯")) {
      type = "success";
      icon = itemText.slice(0, 2);
      itemText = itemText.slice(2).trim();
    }

    if (itemText.length > 10) { // Only add substantial insights
      insights.push({
        text: itemText,
        icon,
        type,
      });
      remainingText = remainingText.replace(match[0], "");
    }
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
  const cleanLabel = label.toLowerCase().trim();
  const mapping: Record<string, string> = {
    revenue: "Revenue",
    gmv: "Revenue",
    orders: "Orders",
    order: "Orders",
    aov: "Avg Order",
    units: "Units Sold",
    unit: "Units Sold",
    customers: "Customers",
    customer: "Customers",
    share: "Share",
    approval: "Approval",
    "approval rate": "Approval Rate",
    discount: "Discount",
    "split rate": "Split Rate",
    split: "Split Rate",
    total: "Total",
    sales: "Sales",
    avg: "Average",
    average: "Average",
  };

  return mapping[cleanLabel] || label;
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

  // Debug: log input
  console.log("🔍 parseResponse input length:", content.length, "starts with:", content.substring(0, 100));

  // 1. Extract headline (HEADLINE: text)
  const { headline, remainingText: afterHeadline } = extractHeadline(text);
  console.log("🔍 Headline extracted:", headline ? "YES" : "NO", headline?.substring(0, 50));
  if (headline) {
    result.headline = headline;
    sections.push({ type: "headline", content: headline, order: order++ });
    text = afterHeadline;
  }

  // 2. Extract KPIs from "THE NUMBERS" section
  const { kpis, remainingText: afterKPIs } = extractKPIs(text);
  console.log("🔍 KPIs extracted:", kpis.length, kpis.map(k => k.label));
  if (kpis.length > 0) {
    result.kpiCards = kpis;
    sections.push({ type: "kpis", content: kpis, order: order++ });
    text = afterKPIs;
  }

  // 3. Extract alerts from "ALERTS" section (rendered as insights)
  const { alerts, remainingText: afterAlerts } = extractAlerts(text);
  console.log("🔍 Alerts extracted:", alerts.length);
  text = afterAlerts;

  // 4. Extract chart data
  const { chartData, remainingText: afterChart } = extractChartData(text);
  if (chartData.length > 0) {
    result.chartData = chartData;
    sections.push({ type: "chart", content: chartData, order: order++ });
    text = afterChart;
  }

  // 5. Extract menu engineering
  const { menuEng, remainingText: afterMenu } = extractMenuEngineering(text);
  if (menuEng.length > 0) {
    result.menuEngineering = menuEng;
    sections.push({ type: "menu", title: "Menu Engineering", content: menuEng, order: order++ });
    text = afterMenu;
  }

  // 6. Extract recommendations
  const { recommendations, remainingText: afterRecs } = extractRecommendations(text);
  if (recommendations.length > 0) {
    result.recommendations = recommendations;
    sections.push({ type: "recommendations", title: "Recommendations", content: recommendations, order: order++ });
    text = afterRecs;
  }

  // 7. Extract other insights (bullet points)
  const { insights: otherInsights, remainingText: afterInsights } = extractInsights(text);

  // Combine alerts and other insights
  const allInsights = [...alerts, ...otherInsights];
  if (allInsights.length > 0) {
    result.insights = allInsights;
    sections.push({ type: "insights", title: alerts.length > 0 ? "Alerts & Insights" : "What the data says", content: allInsights, order: order++ });
    text = afterInsights;
  }

  // 8. Extract table
  const { table, remainingText: afterTable } = extractTable(text);
  if (table) {
    result.tableData = table;
    sections.push({ type: "table", content: table, order: order++ });
    text = afterTable;
  }

  // 9. Keep remaining text (but clean up section headers)
  let cleanedText = text
    .replace(/^[A-Z][A-Z\s]+:\s*$/gm, "") // Remove empty section headers
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (cleanedText.length > 50) {
    result.rawText = cleanedText;
    sections.push({ type: "text", content: cleanedText, order: order++ });
  }

  result.sections = sections;

  // Debug: final summary
  console.log("🔍 Parse complete:", {
    hasHeadline: !!result.headline,
    kpiCount: result.kpiCards?.length || 0,
    alertCount: alerts.length,
    insightCount: result.insights?.length || 0,
    hasVisual: hasVisualContent(result),
  });

  return result;
}

/**
 * Check if a response has any structured content worth visualizing
 */
export function hasVisualContent(parsed: ParsedResponse): boolean {
  return Boolean(
    parsed.headline ||
    parsed.kpiCards?.length ||
    parsed.chartData?.length ||
    parsed.menuEngineering?.length ||
    parsed.recommendations?.length ||
    parsed.insights?.length ||
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
