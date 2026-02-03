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
  // Headline patterns - matches "HEADLINE: text", "## Headline: text", "**Headline:** text"
  headline: /^(?:#{1,3}\s*)?(?:\*\*)?HEADLINE:?\s*(.+?)(?:\*\*)?$/im,
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

  // Item with value pattern for charts - matches various Brain API formats:
  // "• 🔥 Steak & Fries: 4 units = 2,600 EGP GMV (22%)"
  // "• Cappuccino: 16 units"
  // "- Item Name: 500 EGP"
  itemWithValue: /[-•*]\s*(?:🔥|⭐|🧩|🐕|📊)?\s*([^:\n]+?):\s*(\d+)\s*(?:units?|orders?|qty)?\s*(?:=\s*)?([\d,]+(?:\.\d+)?)\s*(EGP|GMV)?/gi,

  // Simpler pattern for "Item: VALUE UNIT" format
  itemSimple: /[-•*]\s*(?:🔥|⭐|🧩|🐕|📊)?\s*([^:\n]+?):\s*([\d,]+(?:\.\d+)?)\s*(EGP|units?|%|orders?)/gi,

  // Ranked list pattern - matches "1. Item Name - 500 EGP" or "1. Item: 500"
  rankedItem: /^\s*(\d+)\.\s*([^:\-–]+?)[\s:\-–]+([\d,]+(?:\.\d+)?)\s*(EGP|units?|%)?/gm,
};

// ============================================================================
// Parser Functions
// ============================================================================

/**
 * Extract headline from response
 */
function extractHeadline(text: string): { headline?: string; remainingText: string } {
  // Try explicit "Headline:" pattern (handles ## Headline:, **HEADLINE:**, etc.)
  let match = text.match(PATTERNS.headline);
  if (match) {
    // Clean up the extracted headline - remove ** markers and trim
    let headline = match[1].trim().replace(/^\*\*\s*/, '').replace(/\s*\*\*$/, '');
    return {
      headline,
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
 * Handles actual Brain API formats from production:
 * - "28,382.95 EGP GMV from 17 successful orders"
 * - "1,669.59 EGP AOV ⚠️"
 * - "94.1% payment approval rate"
 * - "2,076 EGP in tips"
 */
function extractKPIs(text: string): { kpis: KPICard[]; remainingText: string } {
  const kpis: KPICard[] = [];
  let remainingText = text;
  const seenLabels = new Set<string>();
  const matchedLines = new Set<string>();

  // Helper to add KPI if not duplicate
  const addKPI = (label: string, value: number | string, unit: string, matchedText?: string, trend?: KPICard["trend"]) => {
    const normalizedLabel = normalizeKPILabel(label);
    if (seenLabels.has(normalizedLabel.toLowerCase())) return;
    seenLabels.add(normalizedLabel.toLowerCase());
    kpis.push({
      label: normalizedLabel,
      value,
      unit: normalizeUnit(unit),
      trend,
    });
    // Track matched text for removal from insights
    if (matchedText) {
      matchedLines.add(matchedText.trim());
    }
  };

  // Process line by line for more accurate matching
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // PATTERN 1: "28,382.95 EGP GMV from 17 successful orders"
    const gmvOrdersMatch = trimmedLine.match(/^([\d,]+(?:\.\d+)?)\s*EGP\s+(?:GMV|total\s+sales|revenue)\s+from\s+(\d+)\s+(?:successful\s+)?orders/i);
    if (gmvOrdersMatch) {
      const gmvValue = parseFloat(gmvOrdersMatch[1].replace(/,/g, ""));
      const ordersValue = parseInt(gmvOrdersMatch[2]);
      addKPI("Revenue", gmvValue, "EGP", trimmedLine);
      addKPI("Orders", ordersValue, "", trimmedLine);
      continue;
    }

    // PATTERN 2: "1,669.59 EGP AOV" (with optional emoji/text after)
    const aovMatch = trimmedLine.match(/^([\d,]+(?:\.\d+)?)\s*EGP\s+AOV\b/i);
    if (aovMatch) {
      const value = parseFloat(aovMatch[1].replace(/,/g, ""));
      addKPI("Avg Order", value, "EGP", trimmedLine);
      continue;
    }

    // PATTERN 3: "94.1% payment approval rate" or "Approval rate: 94.1%"
    const approvalMatch = trimmedLine.match(/^([\d.]+)%\s+(?:payment\s+)?approval\s*(?:rate)?/i) ||
                          trimmedLine.match(/^Approval\s*(?:rate)?:\s*([\d.]+)%/i);
    if (approvalMatch) {
      const value = parseFloat(approvalMatch[1]);
      addKPI("Approval Rate", value, "%", trimmedLine);
      continue;
    }

    // PATTERN 4: "2,076 EGP in tips" or "Tips: 2,076 EGP"
    const tipsMatch = trimmedLine.match(/^([\d,]+(?:\.\d+)?)\s*EGP\s+(?:in\s+)?tips/i) ||
                      trimmedLine.match(/^Tips?:\s*([\d,]+(?:\.\d+)?)\s*EGP/i);
    if (tipsMatch) {
      const value = parseFloat(tipsMatch[1].replace(/,/g, ""));
      addKPI("Tips", value, "EGP", trimmedLine);
      continue;
    }

    // PATTERN 5: "Split rate: 5.9%" or "5.9% split rate"
    const splitMatch = trimmedLine.match(/^([\d.]+)%\s+(?:of\s+)?(?:orders?\s+had\s+)?split\s*(?:payments?|rate)?/i) ||
                       trimmedLine.match(/^Split\s*(?:rate)?:\s*([\d.]+)%/i);
    if (splitMatch) {
      // Don't add split as KPI - it's more of an insight
      continue;
    }

    // PATTERN 6: Traditional bullet format - "• GMV: 32,195 EGP ↑ 0.5%"
    const bulletKpiMatch = trimmedLine.match(/^[•\-\*]\s*(GMV|Revenue|Orders?|AOV|Units?|Customers?|Total\s*Sales?|Tips?):\s*([\d,]+(?:\.\d+)?)\s*(EGP|%|units?)?\s*([↑↓])?\s*([+-]?\d+(?:\.\d+)?%?)?/i);
    if (bulletKpiMatch) {
      const label = bulletKpiMatch[1].trim();
      const rawValue = bulletKpiMatch[2].replace(/,/g, "");
      const unit = bulletKpiMatch[3] || "";
      const trendDir = bulletKpiMatch[4];
      const trendVal = bulletKpiMatch[5];

      const value = parseFloat(rawValue);

      let trend: KPICard["trend"] | undefined;
      if (trendDir && trendVal) {
        trend = {
          direction: trendDir === "↑" ? "up" : "down",
          value: Math.abs(parseFloat(trendVal.replace("%", "").replace("+", "").replace("-", ""))),
          label: "vs last period",
        };
      }

      addKPI(label, isNaN(value) ? rawValue : value, unit, trimmedLine, trend);
      continue;
    }
  }

  // Remove matched KPI lines from remaining text to avoid showing in insights
  for (const matchedLine of matchedLines) {
    // Remove the line and any bullet point prefix
    remainingText = remainingText.replace(new RegExp(`^[•\\-\\*]?\\s*${escapeRegex(matchedLine)}\\s*$`, 'gm'), '');
    remainingText = remainingText.replace(matchedLine, '');
  }

  // Also remove "THE NUMBERS" header if present
  remainingText = remainingText.replace(/(?:THE NUMBERS|KEY METRICS|METRICS)[^:]*:\s*\n?/im, "");

  // Clean up extra newlines
  remainingText = remainingText.replace(/\n{3,}/g, '\n\n').trim();

  return { kpis: kpis.length > 0 ? kpis : [], remainingText };
}

// Helper to escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
 * Handles Brain API formats like:
 * - "• 🔥 Steak & Fries: 4 units = 22% of beef units • 2,600 EGP GMV"
 * - "• Cappuccino: 16 units | 1,600 EGP GMV"
 * - "1. Item - 500 EGP"
 */
function extractChartData(text: string): { chartData: ChartDataPoint[]; remainingText: string } {
  const chartData: ChartDataPoint[] = [];
  let remainingText = text;
  const seenNames = new Set<string>();

  // PRIMARY METHOD: Line-by-line extraction (most reliable)
  // This handles the actual Brain API format: "• 🔥 Item: X units = Y% • N,NNN EGP GMV"
  const lines = text.split('\n');
  for (const line of lines) {
    // Must be a bullet line (starts with •, -, or *)
    const trimmedLine = line.trim();
    if (!/^[-•*]/.test(trimmedLine)) continue;

    // Extract item name (before first colon)
    const nameMatch = trimmedLine.match(/^[-•*]\s*(?:🔥|⭐|🧩|🐕|📊|⚠️)?\s*([^:\n]+?):/);
    if (!nameMatch) continue;

    const name = nameMatch[1].trim();

    // Skip if it's a KPI metric or header (these should go to KPI cards, not chart)
    if (/^(GMV|Revenue|Orders?|AOV|Approval|Split|Total|Key|The|This|Tips?|Impact|Payment|Sales)/i.test(name)) continue;
    if (seenNames.has(name.toLowerCase())) continue;
    if (name.length < 2 || name.length > 50) continue;

    // Find ALL "NUMBER EGP" patterns in the line
    const egpMatches = [...trimmedLine.matchAll(/([\d,]+(?:\.\d+)?)\s*EGP/gi)];
    if (egpMatches.length === 0) continue;

    // Take the LARGEST EGP value (usually the GMV, not percentages or small values)
    let maxValue = 0;
    for (const egpMatch of egpMatches) {
      const val = parseFloat(egpMatch[1].replace(/,/g, ""));
      if (val > maxValue && val >= 100) { // Skip tiny values like percentages
        maxValue = val;
      }
    }

    // If no large value found, take any value > 0
    if (maxValue === 0) {
      for (const egpMatch of egpMatches) {
        const val = parseFloat(egpMatch[1].replace(/,/g, ""));
        if (val > maxValue) maxValue = val;
      }
    }

    if (maxValue === 0) continue;

    seenNames.add(name.toLowerCase());
    chartData.push({
      name: name.length > 20 ? name.substring(0, 17) + "..." : name,
      value: maxValue,
      label: "EGP",
    });
  }

  // FALLBACK: Try simpler patterns if we don't have enough data
  if (chartData.length < 3) {
    // Simple pattern: "Item: VALUE EGP" without bullet
    const simpleMatches = [...text.matchAll(/([A-Za-z][A-Za-z &']+?):\s*([\d,]+(?:\.\d+)?)\s*EGP/gi)];
    for (const match of simpleMatches) {
      const name = match[1].trim();
      const rawValue = match[2].replace(/,/g, "");
      const value = parseFloat(rawValue);

      if (/^(GMV|Revenue|Orders?|AOV|Approval|Split|Total|Key|The|Tips?|Impact|Payment|Sales)/i.test(name)) continue;
      if (seenNames.has(name.toLowerCase())) continue;
      if (isNaN(value) || value === 0) continue;
      if (name.length < 2 || name.length > 40) continue;

      seenNames.add(name.toLowerCase());
      chartData.push({
        name: name.length > 20 ? name.substring(0, 17) + "..." : name,
        value,
        label: "EGP",
      });
    }
  }

  // Ranked list fallback: "1. Item - 500 EGP"
  if (chartData.length < 3) {
    const rankedMatches = [...text.matchAll(PATTERNS.rankedItem)];
    for (const match of rankedMatches) {
      const name = match[2].trim();
      const rawValue = match[3].replace(/,/g, "");
      const unit = match[4] || "";
      const value = parseFloat(rawValue);

      if (seenNames.has(name.toLowerCase())) continue;
      if (isNaN(value) || value === 0) continue;

      seenNames.add(name.toLowerCase());
      chartData.push({
        name: name.length > 20 ? name.substring(0, 17) + "..." : name,
        value,
        label: unit,
      });
    }
  }

  // Last resort: look for any "Item: N EGP GMV" pattern
  if (chartData.length < 3) {
    // More flexible pattern: "Item Name: N EGP GMV" or "Item: N,NNN EGP"
    const flexPattern = /\*?\*?([A-Za-z][A-Za-z &']+?)(?:\*\*)?\s*[:=]\s*([\d,]+(?:\.\d+)?)\s*(?:EGP|GMV)/gi;
    const flexMatches = [...text.matchAll(flexPattern)];

    for (const match of flexMatches) {
      const name = match[1].trim().replace(/^\*+/, '').replace(/\*+$/, '');
      const rawValue = match[2].replace(/,/g, "");
      const value = parseFloat(rawValue);

      // Skip common non-item words
      if (/^(total|revenue|gmv|orders?|aov|sales|headline|items?|beef|units?)/i.test(name)) continue;
      if (seenNames.has(name.toLowerCase())) continue;
      if (isNaN(value) || value === 0) continue;
      if (name.length < 3 || name.length > 40) continue;

      seenNames.add(name.toLowerCase());
      chartData.push({
        name: name.length > 20 ? name.substring(0, 17) + "..." : name,
        value,
        label: "EGP",
      });
    }
  }

  // Only return chart data if we have enough items
  const minItemsForChart = 3;
  return {
    chartData: chartData.length >= minItemsForChart ? chartData.slice(0, 8) : [],
    remainingText
  };
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
    "total sales": "Revenue",
    orders: "Orders",
    order: "Orders",
    aov: "Avg Order",
    "avg order": "Avg Order",
    "average order value": "Avg Order",
    units: "Units Sold",
    unit: "Units Sold",
    customers: "Customers",
    customer: "Customers",
    share: "Share",
    approval: "Approval Rate",
    "approval rate": "Approval Rate",
    discount: "Discount",
    "split rate": "Split Rate",
    split: "Split Rate",
    total: "Total",
    sales: "Revenue",
    avg: "Average",
    average: "Average",
    tips: "Tips",
    tip: "Tips",
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

  // 1. Extract headline (HEADLINE: text)
  const { headline, remainingText: afterHeadline } = extractHeadline(text);
  if (headline) {
    result.headline = headline;
    sections.push({ type: "headline", content: headline, order: order++ });
    text = afterHeadline;
  }

  // 2. Extract KPIs from "THE NUMBERS" section
  const { kpis, remainingText: afterKPIs } = extractKPIs(text);
  if (kpis.length > 0) {
    result.kpiCards = kpis;
    sections.push({ type: "kpis", content: kpis, order: order++ });
    text = afterKPIs;
  }

  // 3. Extract alerts from "ALERTS" section (rendered as insights)
  const { alerts, remainingText: afterAlerts } = extractAlerts(text);
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
