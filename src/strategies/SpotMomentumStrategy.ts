import { IStrategy, StrategyEvaluationContext, StrategySignal } from "./types.js";
import { Logger } from "../utils/logger.js";

export class SpotMomentumStrategy implements IStrategy {
  public readonly name = "SpotMomentumStrategy";
  public readonly weight = 0.35;
  private logger = new Logger("SpotMomentumStrategy");

  async evaluate(context: StrategyEvaluationContext): Promise<StrategySignal | null> {
    this.logger.debug("Evaluating Solana Spot Momentum (SOL / LSTs / USDC)...");

    const usdcValue = context.tokenBalances["USDC"]?.valueUsd || 0;
    const solBalance = context.solBalance;

    // Bullish sentiment + sufficient stable capital -> allocate to high-yield LST or SOL via Jupiter
    if (context.marketSentiment === "BULLISH" && usdcValue >= 25.0) {
      const allocation = Math.min(25.0, usdcValue * 0.4);
      return {
        strategyName: this.name,
        actionType: "SPOT_SWAP",
        confidence: 0.82,
        targetProtocol: "Jupiter",
        sourceToken: "USDC",
        destinationToken: "jupSOL",
        allocationAmountUsd: allocation,
        maxSlippageBps: 30, // 0.3%
        rationale: `Bullish momentum detected; reallocating $${allocation.toFixed(2)} USDC into yield-bearing jupSOL via Jupiter Aggregator`,
      };
    }

    // High volatility -> preserve capital by locking into USDC
    if (context.volatilityIndex === "HIGH" && solBalance > 1.0) {
      return {
        strategyName: this.name,
        actionType: "SPOT_SWAP",
        confidence: 0.75,
        targetProtocol: "Jupiter",
        sourceToken: "SOL",
        destinationToken: "USDC",
        allocationAmountUsd: 20.0,
        maxSlippageBps: 40,
        rationale: `Elevated market volatility detected; taking profits into USDC to safeguard capital`,
      };
    }

    return null;
  }
}
