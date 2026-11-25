import { Logger } from "../utils/logger.js";

export interface SlippageConfig {
  baseSlippageBps: number;
  maxAllowableSlippageBps: number;
  volatilityMultiplier: number;
}

export class SlippageManager {
  private logger = new Logger("SlippageManager");
  private config: SlippageConfig;

  constructor(maxAllowableSlippageBps: number = 50) {
    this.config = {
      baseSlippageBps: 20, // 0.20%
      maxAllowableSlippageBps,
      volatilityMultiplier: 1.5,
    };
  }

  /**
   * Dynamically calculates slippage tolerance based on market volatility and pool liquidity
   */
  public computeDynamicSlippage(params: {
    requestedBps?: number;
    volatilityIndex: "LOW" | "MEDIUM" | "HIGH";
    estimatedPriceImpactPct: number;
  }): { slippageBps: number; isSafe: boolean; warning?: string } {
    let effectiveBps = params.requestedBps || this.config.baseSlippageBps;

    if (params.volatilityIndex === "HIGH") {
      effectiveBps = Math.round(effectiveBps * this.config.volatilityMultiplier);
    } else if (params.volatilityIndex === "LOW") {
      effectiveBps = Math.max(10, Math.round(effectiveBps * 0.8));
    }

    // Include price impact buffer
    const priceImpactBps = Math.round(params.estimatedPriceImpactPct * 100);
    effectiveBps = Math.max(effectiveBps, priceImpactBps + 10);

    if (effectiveBps > this.config.maxAllowableSlippageBps) {
      const warning = `Computed slippage ${effectiveBps} bps exceeds max limit ${this.config.maxAllowableSlippageBps} bps`;
      this.logger.warn(warning);
      return {
        slippageBps: this.config.maxAllowableSlippageBps,
        isSafe: false,
        warning,
      };
    }

    return {
      slippageBps: effectiveBps,
      isSafe: true,
    };
  }
}
