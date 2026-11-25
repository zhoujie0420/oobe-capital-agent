import dotenv from "dotenv";
import { z } from "zod";
import { DEFAULT_GUARDRAILS, OOBEGuardrailsConfig } from "./guardrails.js";

dotenv.config();

const EnvSchema = z.object({
  SOLANA_NETWORK: z.enum(["mainnet-beta", "devnet", "testnet"]).default("mainnet-beta"),
  SOLANA_RPC_URL: z.string().default("https://api.mainnet-beta.solana.com"),
  AGENT_PRIVATE_KEY: z.string().optional(),
  EXECUTION_MODE: z.enum(["simulation", "live"]).default("simulation"),
  POLL_INTERVAL_MS: z.coerce.number().default(15000),
  MAX_CONCURRENT_ACTIONS: z.coerce.number().default(2),
  MAX_ALLOCATION_PER_TRADE_USD: z.coerce.number().default(DEFAULT_GUARDRAILS.maxAllocationPerTradeUsd),
  MAX_DAILY_VOLUME_USD: z.coerce.number().default(DEFAULT_GUARDRAILS.maxDailyVolumeUsd),
  MIN_SOL_RESERVE_GAS: z.coerce.number().default(DEFAULT_GUARDRAILS.minSolReserveGas),
  MAX_SLIPPAGE_BPS: z.coerce.number().default(DEFAULT_GUARDRAILS.maxSlippageBps),
  CIRCUIT_BREAKER_MAX_DRAWDOWN_PCT: z.coerce.number().default(DEFAULT_GUARDRAILS.circuitBreakerMaxDrawdownPct),
  STEVE_MCP_ENDPOINT: z.string().default("https://steve.oobeprotocol.ai/mcp"),
  MULTI_HOPPER_ENABLED: z.coerce.boolean().default(true),
  MULTI_HOPPER_API_URL: z.string().default("https://api.multihopper.com/v1"),
  ACE_DATA_CLOUD_API_KEY: z.string().optional(),
});

export type AgentConfig = z.infer<typeof EnvSchema> & {
  guardrails: OOBEGuardrailsConfig;
};

export function loadConfig(): AgentConfig {
  const env = EnvSchema.parse(process.env);

  const guardrails: OOBEGuardrailsConfig = {
    maxAllocationPerTradeUsd: env.MAX_ALLOCATION_PER_TRADE_USD,
    maxDailyVolumeUsd: env.MAX_DAILY_VOLUME_USD,
    minSolReserveGas: env.MIN_SOL_RESERVE_GAS,
    maxSlippageBps: env.MAX_SLIPPAGE_BPS,
    circuitBreakerMaxDrawdownPct: env.CIRCUIT_BREAKER_MAX_DRAWDOWN_PCT,
    allowedProtocols: DEFAULT_GUARDRAILS.allowedProtocols,
    allowedTokens: DEFAULT_GUARDRAILS.allowedTokens,
  };

  return {
    ...env,
    guardrails,
  };
}
