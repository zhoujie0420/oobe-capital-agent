import { describe, it, expect } from "vitest";
import { MultiHopperRouterStrategy } from "../../src/strategies/MultiHopperRouter.js";

describe("MultiHopperRouterStrategy", () => {
  it("should generate multi-hop routing signal when sufficient capital exists", async () => {
    const strategy = new MultiHopperRouterStrategy();
    const signal = await strategy.evaluate({
      portfolioTotalUsd: 200,
      solBalance: 1.0,
      tokenBalances: {
        USDC: { amount: 60, valueUsd: 60 },
      },
      marketSentiment: "BULLISH",
      volatilityIndex: "MEDIUM",
    });

    expect(signal).not.toBeNull();
    expect(signal?.actionType).toBe("MULTI_HOPPER_ROUTING");
    expect(signal?.targetProtocol).toBe("MultiHopper");
  });
});
