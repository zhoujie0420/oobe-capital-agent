export interface OOBEGuardrailsConfig {
  /** Maximum single allocation allowed in USD */
  maxAllocationPerTradeUsd: number;
  /** Maximum total daily volume in USD */
  maxDailyVolumeUsd: number;
  /** Minimum SOL to always keep in wallet for transaction fees (gas reserve) */
  minSolReserveGas: number;
  /** Maximum allowable slippage in basis points (e.g. 50 = 0.5%) */
  maxSlippageBps: number;
  /** Circuit breaker drawdown trigger percentage (e.g. 10.0 = 10%) */
  circuitBreakerMaxDrawdownPct: number;
  /** Allowed DEX / AMM protocols */
  allowedProtocols: string[];
  /** Allowed token mint symbols */
  allowedTokens: string[];
}

export const DEFAULT_GUARDRAILS: OOBEGuardrailsConfig = {
  maxAllocationPerTradeUsd: 50.0,
  maxDailyVolumeUsd: 500.0,
  minSolReserveGas: 0.05,
  maxSlippageBps: 50, // 0.5%
  circuitBreakerMaxDrawdownPct: 10.0,
  allowedProtocols: ["Jupiter", "MultiHopper", "Kamino", "Meteora", "Orca", "Raydium"],
  allowedTokens: ["SOL", "USDC", "USDT", "jupSOL", "bSOL"],
};
