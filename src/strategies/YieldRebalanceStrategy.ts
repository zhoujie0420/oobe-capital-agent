import { IStrategy, StrategyEvaluationContext, StrategySignal } from "./types.js";
import { Logger } from "../utils/logger.js";

export interface YieldPoolOpportunity {
  protocol: string;
  poolName: string;
  asset: string;
  apyPct: number;
  tvlUsd: number;
}

export class YieldRebalanceStrategy implements IStrategy {
  public readonly name = "YieldRebalanceStrategy";
  public readonly weight = 0.4;
  private logger = new Logger("YieldRebalanceStrategy");

  // Threshold difference in APY needed to trigger rebalance
  private apyRebalanceThresholdPct: number = 1.5;

  private currentPools: YieldPoolOpportunity[] = [
    {
      protocol: "Kamino",
      poolName: "Kamino USDC Reserve",
      asset: "USDC",
      apyPct: 8.4,
      tvlUsd: 125000000,
    },
    {
      protocol: "Meteora",
      poolName: "Meteora Dynamic DLMM SOL/USDC",
      asset: "USDC",
      apyPct: 14.8,
      tvlUsd: 45000000,
    },
    {
      protocol: "Orca",
      poolName: "Orca Whirlpool jupSOL/SOL",
      asset: "jupSOL",
      apyPct: 9.2,
      tvlUsd: 80000000,
    },
  ];

  async evaluate(context: StrategyEvaluationContext): Promise<StrategySignal | null> {
    this.logger.debug("Evaluating Solana yield opportunities (Kamino vs Meteora DLMM vs Orca)...");

    const bestPool = [...this.currentPools].sort((a, b) => b.apyPct - a.apyPct)[0];
    const usdcBalance = context.tokenBalances["USDC"]?.amount || 0;

    // If we have idle USDC (> $20) and best pool APY is attractive
    if (usdcBalance >= 20 && bestPool.apyPct > 10.0) {
      const allocateUsd = Math.min(30.0, usdcBalance * 0.5);
      return {
        strategyName: this.name,
        actionType: "YIELD_REBALANCE",
        confidence: 0.88,
        targetProtocol: bestPool.protocol,
        sourceToken: "USDC",
        destinationToken: "USDC",
        allocationAmountUsd: allocateUsd,
        maxSlippageBps: 20, // 0.2%
        rationale: `Reallocating capital into highest yielding ${bestPool.protocol} (${bestPool.poolName}) delivering ${bestPool.apyPct}% APY`,
      };
    }

    return null;
  }
}
