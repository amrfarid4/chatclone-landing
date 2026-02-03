import { describe, it, expect } from "vitest";
import { parseResponse, hasVisualContent } from "../lib/responseParser";

describe("responseParser", () => {
  describe("parseResponse", () => {
    it("should extract headline from **HEADLINE:** format", () => {
      const content = `**HEADLINE:** Your beef category is underperforming—only 2 items drive 58% of revenue.

Some other content here.`;

      const result = parseResponse(content);
      expect(result.headline).toBeDefined();
      expect(result.headline).not.toContain("**");
      expect(result.headline).toContain("beef category");
    });

    it("should extract headline from ## Headline: format", () => {
      const content = `## Headline: Your coffee revenue is overly dependent on Cappuccino

Other content follows.`;

      const result = parseResponse(content);
      expect(result.headline).toBeDefined();
      expect(result.headline).toContain("coffee revenue");
    });

    it("should extract headline with no space after colon (actual Brain API format)", () => {
      const content = `Headline:Your beef sales are over-concentrated in 3 items—so the fastest way to grow revenue.

📊 Key numbers (Feb 1–2):`;

      const result = parseResponse(content);
      expect(result.headline).toBeDefined();
      expect(result.headline).toContain("beef sales");
    });

    it("should extract chart data from Brain API format with arrow", () => {
      const content = `Here are your top beef items:

• 🔥 Steak & Fries: 4 units → 2,600 EGP GMV (22%)
• 🔥 Roast Beef Sandwich: 4 units → 1,140 EGP GMV (22%)
• Steak Bordalise: 3 units → 2,250 EGP GMV (17%)
• Mongolian Beef: 2 units → 920 EGP GMV`;

      const result = parseResponse(content);
      expect(result.chartData).toBeDefined();
      expect(result.chartData!.length).toBeGreaterThanOrEqual(3);

      // Check that values are extracted correctly (GMV values)
      const steakFries = result.chartData!.find(d => d.name.includes("Steak & Fries"));
      expect(steakFries).toBeDefined();
      expect(steakFries!.value).toBe(2600);
    });

    it("should extract chart data from Brain API format with equals", () => {
      const content = `Here are your top beef items:

• 🔥 Steak & Fries: 4 units = 2,600 EGP GMV (22%)
• 🔥 Roast Beef Sandwich: 4 units = 1,140 EGP GMV (22%)
• Steak Bordalise: 3 units = 2,250 EGP GMV (17%)`;

      const result = parseResponse(content);
      expect(result.chartData).toBeDefined();
      expect(result.chartData!.length).toBeGreaterThanOrEqual(3);
    });

    it("should extract chart data from actual screenshot format with percentage and bullet separator", () => {
      // This matches the exact format from the user's screenshot
      const content = `Headline:Your beef sales are over-concentrated in 3 items—so thefastest way to grow revenue this week is to protect the top sellers, fix menu leakage, and bundle for higher basket value.

📊 Key numbers (Feb 1–2):

• 🔥 Steak & Fries: 4 units = 22% of beef units • 2,600 EGP GMV (highest revenue driver)
• 🔥 Roast Beef Sandwich: 4 units = 22% • 1,140 EGP GMV (same volume, much lower revenue per unit)
• Steak Bordalise: 3 units = 17% • 2,250 EGP GMV (strong premium pull)
• ⚠️ Mongolian Beef split: 2 units (920 EGP) + "Monogolian Beef" 1 unit (460 EGP) = 3 units / 1,380 EGP but fragmented`;

      const result = parseResponse(content);
      expect(result.headline).toBeDefined();
      expect(result.headline).toContain("beef sales");

      expect(result.chartData).toBeDefined();
      expect(result.chartData!.length).toBeGreaterThanOrEqual(3);

      // Check that we're extracting the EGP GMV values, not percentages
      const steakFries = result.chartData!.find(d => d.name.includes("Steak"));
      expect(steakFries).toBeDefined();
      expect(steakFries!.value).toBeGreaterThanOrEqual(1000); // Should be 2600, not 22
    });

    it("should extract chart data from simple format", () => {
      const content = `Top items:

• Cappuccino: 1,600 EGP
• Flat White: 425 EGP
• Toffee Nut Latte: 520 EGP`;

      const result = parseResponse(content);
      expect(result.chartData).toBeDefined();
      expect(result.chartData!.length).toBe(3);
    });

    it("should extract KPIs from THE NUMBERS section", () => {
      const content = `THE NUMBERS (vs last Monday):
• GMV: 32,195 EGP ↑ +0.5%
• Orders: 17 ↓ -29.2%
• AOV: 1,894 EGP ↑ +42.0%`;

      const result = parseResponse(content);
      expect(result.kpiCards).toBeDefined();
      expect(result.kpiCards!.length).toBeGreaterThanOrEqual(2);

      const gmv = result.kpiCards!.find(k => k.label === "Revenue");
      expect(gmv).toBeDefined();
      expect(gmv!.value).toBe(32195);
    });

    it("should extract KPIs from Brain API sentence format", () => {
      // Actual Brain API format from user screenshot
      const content = `28,382.95 EGP GMV from 17 successful orders
1,669.59 EGP AOV
94.1% payment approval rate
2,076 EGP in tips`;

      const result = parseResponse(content);
      expect(result.kpiCards).toBeDefined();
      expect(result.kpiCards!.length).toBeGreaterThanOrEqual(3);

      // Check Revenue KPI
      const revenue = result.kpiCards!.find(k => k.label === "Revenue");
      expect(revenue).toBeDefined();
      expect(revenue!.value).toBeCloseTo(28382.95, 0);

      // Check Orders KPI
      const orders = result.kpiCards!.find(k => k.label === "Orders");
      expect(orders).toBeDefined();
      expect(orders!.value).toBe(17);

      // Check AOV KPI
      const aov = result.kpiCards!.find(k => k.label === "Avg Order");
      expect(aov).toBeDefined();
      expect(aov!.value).toBeCloseTo(1669.59, 0);

      // Check Approval Rate KPI
      const approval = result.kpiCards!.find(k => k.label === "Approval Rate");
      expect(approval).toBeDefined();
      expect(approval!.value).toBeCloseTo(94.1, 0);

      // Check Tips KPI
      const tips = result.kpiCards!.find(k => k.label === "Tips");
      expect(tips).toBeDefined();
      expect(tips!.value).toBe(2076);
    });

    it("should extract menu engineering classifications", () => {
      const content = `Menu engineering call:

• STAR: Cappuccino, Latte
• PLOWHORSE: Filter Coffee
• PUZZLE: Flat White
• DOG: Decaf Americano`;

      const result = parseResponse(content);
      expect(result.menuEngineering).toBeDefined();
      expect(result.menuEngineering!.length).toBeGreaterThanOrEqual(2);

      const star = result.menuEngineering!.find(m => m.category === "STAR");
      expect(star).toBeDefined();
      expect(star!.items).toContain("Cappuccino");
    });

    it("should extract insights from bullet points", () => {
      const content = `What the data says:

• Cappuccino drives 39% of coffee revenue
• Flat White is your only second-tier performer
• Filter Coffee is underperforming vs last week`;

      const result = parseResponse(content);
      expect(result.insights).toBeDefined();
      expect(result.insights!.length).toBeGreaterThanOrEqual(2);
    });

    it("should handle empty or invalid content", () => {
      const emptyResult = parseResponse("");
      expect(emptyResult).toBeDefined();

      const plainResult = parseResponse("Just some plain text");
      expect(plainResult).toBeDefined();
      // Plain text without structure should have sections array
      expect(plainResult.sections).toBeDefined();
    });
  });

  describe("full integration test", () => {
    it("should parse complete Brain API response with all visual data", () => {
      // Exact content format from the user's screenshot
      const content = `Headline:Your beef sales are over-concentrated in 3 items—so thefastest way to grow revenue this week is to protect the top sellers, fix menu leakage, and bundle for higher basket value.

📊 Key numbers (Feb 1–2):

• 🔥 Steak & Fries: 4 units = 22% of beef units • 2,600 EGP GMV (highest revenue driver)
• 🔥 Roast Beef Sandwich: 4 units = 22% • 1,140 EGP GMV (same volume, much lower revenue per unit)
• Steak Bordalise: 3 units = 17% • 2,250 EGP GMV (strong premium pull)
• ⚠️ Mongolian Beef split: 2 units (920 EGP) + "Monogolian Beef" 1 unit (460 EGP) = 3 units / 1,380 EGP but fragmented
• ⚠️ This is only 2 days of data—small sample, so don't overreact, but act on obvious leaks.

Menu-engineering calls (margin ~ assumptions):

• Steak & Fries = ⭐ STAR (high demand + likely ~55% margin (estimated) if portioned right) → protect & feature
• Roast Beef Sandwich = 🐴 PLOWHORSE risk (high units, lower GMV/unit) → needs pricing review`;

      const result = parseResponse(content);

      // Test 1: Headline is extracted
      expect(result.headline).toBeDefined();
      expect(result.headline).toContain("beef sales");

      // Test 2: Chart data is extracted (at least 3 items)
      expect(result.chartData).toBeDefined();
      expect(result.chartData!.length).toBeGreaterThanOrEqual(3);

      // Test 3: Chart values are the EGP GMV values (not percentages)
      const steakFries = result.chartData!.find(d => d.name.includes("Steak") && !d.name.includes("Bordalise"));
      expect(steakFries).toBeDefined();
      expect(steakFries!.value).toBe(2600);

      // Test 4: hasVisualContent returns true
      expect(hasVisualContent(result)).toBe(true);

      // Test 5: Insights are extracted
      expect(result.insights).toBeDefined();
      expect(result.insights!.length).toBeGreaterThan(0);

      // Note: Menu engineering format "Item = ⭐ STAR" differs from standard "STAR: Items"
      // The actual Brain API format puts the item first, then the category
      // We may not extract this, but charts/headline/insights should work
    });
  });

  describe("hasVisualContent", () => {
    it("should return true when headline exists", () => {
      const result = parseResponse("**HEADLINE:** Test headline\n\nMore content");
      expect(hasVisualContent(result)).toBe(true);
    });

    it("should return true when KPIs exist", () => {
      const result = parseResponse(`THE NUMBERS:
• GMV: 32,195 EGP ↑ +0.5%
• Orders: 17`);
      expect(hasVisualContent(result)).toBe(true);
    });

    it("should return true when chart data exists", () => {
      const result = parseResponse(`Top items:
• Item A: 4 units = 2,600 EGP GMV
• Item B: 3 units = 1,500 EGP GMV
• Item C: 2 units = 800 EGP GMV`);
      expect(hasVisualContent(result)).toBe(true);
    });

    it("should return false for plain text without structured data", () => {
      const result = parseResponse("Just some regular text without any metrics or data.");
      expect(hasVisualContent(result)).toBe(false);
    });
  });
});
