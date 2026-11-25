export type StrategyActionType =
  | "SPOT_SWAP"
  | "YIELD_REBALANCE"
  | "MULTI_HOPPER_ROUTING"
  | "LIQUIDITY_PROVISION"
  | "NO_ACTION";

export interface StrategySignal {
  strategyName: string;
  actionType: StrategyActionType;
  confidence: number; // 0.0 to 1.0
  targetProtocol: string;
  sourceToken: string;
  destinationToken: string;
  allocationAmountUsd: number;
  maxSlippageBps: number;
  rationale: string;
}

export interface IStrategy {
  readonly name: string;
  readonly weight: number;
  evaluate(context: StrategyEvaluationContext): Promise<StrategySignal | null>;
}

export interface StrategyEvaluationContext {
  portfolioTotalUsd: number;
  solBalance: number;
  tokenBalances: Record<string, { amount: number; valueUsd: number }>;
  marketSentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  volatilityIndex: "LOW" | "MEDIUM" | "HIGH";
}
