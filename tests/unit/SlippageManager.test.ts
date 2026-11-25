import { describe, it, expect } from "vitest";
import { SlippageManager } from "../../src/execution/SlippageManager.js";

describe("SlippageManager", () => {
  it("should calculate normal slippage safely", () => {
    const sm = new SlippageManager(50);
    const result = sm.computeDynamicSlippage({
      requestedBps: 20,
      volatilityIndex: "LOW",
      estimatedPriceImpactPct: 0.01,
    });

    expect(result.isSafe).toBe(true);
    expect(result.slippageBps).toBeLessThanOrEqual(50);
  });

  it("should increase slippage tolerance during HIGH volatility", () => {
    const sm = new SlippageManager(100);
    const result = sm.computeDynamicSlippage({
      requestedBps: 20,
      volatilityIndex: "HIGH",
      estimatedPriceImpactPct: 0.02,
    });

    expect(result.isSafe).toBe(true);
    expect(result.slippageBps).toBeGreaterThan(20);
  });

  it("should flag unsafe conditions when slippage exceeds max allowable", () => {
    const sm = new SlippageManager(30);
    const result = sm.computeDynamicSlippage({
      requestedBps: 80,
      volatilityIndex: "HIGH",
      estimatedPriceImpactPct: 0.5,
    });

    expect(result.isSafe).toBe(false);
    expect(result.slippageBps).toBe(30);
  });
});
