import { describe, it, expect } from "vitest";
import { YieldRebalanceStrategy } from "../../src/strategies/YieldRebalanceStrategy.js";

describe("YieldRebalanceStrategy", () => {
  it("should generate a signal when idle USDC is available and APY is high", async () => {
    const strategy = new YieldRebalanceStrategy();
    const signal = await strategy.evaluate({
      portfolioTotalUsd: 100,
      solBalance: 0.5,
      tokenBalances: {
        USDC: { amount: 50, valueUsd: 50 },
      },
      marketSentiment: "BULLISH",
      volatilityIndex: "LOW",
    });

    expect(signal).not.toBeNull();
    expect(signal?.actionType).toBe("YIELD_REBALANCE");
    expect(signal?.destinationToken).toBe("USDC");
    expect(signal?.allocationAmountUsd).toBeGreaterThan(0);
  });

  it("should return null if USDC balance is below threshold", async () => {
    const strategy = new YieldRebalanceStrategy();
    const signal = await strategy.evaluate({
      portfolioTotalUsd: 100,
      solBalance: 0.5,
      tokenBalances: {
        USDC: { amount: 5, valueUsd: 5 }, // below 20 USDC
      },
      marketSentiment: "BULLISH",
      volatilityIndex: "LOW",
    });

    expect(signal).toBeNull();
  });
});
