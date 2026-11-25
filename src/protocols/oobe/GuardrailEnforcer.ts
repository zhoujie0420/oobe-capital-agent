import { OOBEGuardrailsConfig } from "../../config/guardrails.js";
import { Logger } from "../../utils/logger.js";

export interface GuardrailCheckResult {
  allowed: boolean;
  reason?: string;
}

export class GuardrailEnforcer {
  private logger = new Logger("GuardrailEnforcer");
  private config: OOBEGuardrailsConfig;
  private dailyVolumeAccumulatorUsd: number = 0;
  private lastResetDate: string;
  private peakPortfolioValueUsd: number = 0;

  constructor(config: OOBEGuardrailsConfig) {
    this.config = config;
    this.lastResetDate = new Date().toISOString().slice(0, 10);
  }

  private checkAndResetDailyVolume(): void {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.lastResetDate) {
      this.dailyVolumeAccumulatorUsd = 0;
      this.lastResetDate = today;
      this.logger.info(`Reset daily volume accumulator for date ${today}`);
    }
  }

  public updatePeakPortfolioValue(currentValueUsd: number): void {
    if (currentValueUsd > this.peakPortfolioValueUsd) {
      this.peakPortfolioValueUsd = currentValueUsd;
    }
  }

  public checkDrawdown(currentValueUsd: number): GuardrailCheckResult {
    if (this.peakPortfolioValueUsd <= 0) {
      this.peakPortfolioValueUsd = currentValueUsd;
      return { allowed: true };
    }

    const drawdownPct = ((this.peakPortfolioValueUsd - currentValueUsd) / this.peakPortfolioValueUsd) * 100;
    if (drawdownPct >= this.config.circuitBreakerMaxDrawdownPct) {
      const reason = `Circuit Breaker Triggered: Drawdown is ${drawdownPct.toFixed(2)}%, exceeding max allowable ${this.config.circuitBreakerMaxDrawdownPct}%`;
      this.logger.guardrail(reason);
      return { allowed: false, reason };
    }

    return { allowed: true };
  }

  public validateAction(params: {
    protocol: string;
    tokenSymbol: string;
    amountUsd: number;
    slippageBps: number;
    currentSolBalance: number;
  }): GuardrailCheckResult {
    this.checkAndResetDailyVolume();

    // 1. Protocol Whitelist Check
    if (!this.config.allowedProtocols.includes(params.protocol)) {
      const reason = `Protocol "${params.protocol}" is not in OOBE allowed list: [${this.config.allowedProtocols.join(", ")}]`;
      this.logger.guardrail(`Action rejected: ${reason}`);
      return { allowed: false, reason };
    }

    // 2. Token Whitelist Check
    if (!this.config.allowedTokens.includes(params.tokenSymbol)) {
      const reason = `Token "${params.tokenSymbol}" is not in OOBE allowed list: [${this.config.allowedTokens.join(", ")}]`;
      this.logger.guardrail(`Action rejected: ${reason}`);
      return { allowed: false, reason };
    }

    // 3. Max Single Allocation Check
    if (params.amountUsd > this.config.maxAllocationPerTradeUsd) {
      const reason = `Trade amount $${params.amountUsd.toFixed(2)} exceeds max single allocation limit of $${this.config.maxAllocationPerTradeUsd.toFixed(2)}`;
      this.logger.guardrail(`Action rejected: ${reason}`);
      return { allowed: false, reason };
    }

    // 4. Daily Volume Limit Check
    if (this.dailyVolumeAccumulatorUsd + params.amountUsd > this.config.maxDailyVolumeUsd) {
      const reason = `Projected daily volume $${(this.dailyVolumeAccumulatorUsd + params.amountUsd).toFixed(2)} exceeds daily limit $${this.config.maxDailyVolumeUsd.toFixed(2)}`;
      this.logger.guardrail(`Action rejected: ${reason}`);
      return { allowed: false, reason };
    }

    // 5. Slippage Protection Check
    if (params.slippageBps > this.config.maxSlippageBps) {
      const reason = `Slippage ${params.slippageBps} bps exceeds max allowable ${this.config.maxSlippageBps} bps`;
      this.logger.guardrail(`Action rejected: ${reason}`);
      return { allowed: false, reason };
    }

    // 6. SOL Gas Reserve Check
    if (params.currentSolBalance < this.config.minSolReserveGas) {
      const reason = `Current SOL balance ${params.currentSolBalance.toFixed(4)} is below required gas reserve of ${this.config.minSolReserveGas} SOL`;
      this.logger.guardrail(`Action rejected: ${reason}`);
      return { allowed: false, reason };
    }

    return { allowed: true };
  }

  public recordExecutedVolume(amountUsd: number): void {
    this.checkAndResetDailyVolume();
    this.dailyVolumeAccumulatorUsd += amountUsd;
    this.logger.info(`Recorded volume: $${amountUsd.toFixed(2)}. Daily total: $${this.dailyVolumeAccumulatorUsd.toFixed(2)} / $${this.config.maxDailyVolumeUsd.toFixed(2)}`);
  }

  public getDailyVolumeUsd(): number {
    this.checkAndResetDailyVolume();
    return this.dailyVolumeAccumulatorUsd;
  }
}
