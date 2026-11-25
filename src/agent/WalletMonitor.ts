import { Connection, PublicKey } from "@solana/web3.js";
import { Logger } from "../utils/logger.js";
import { WELL_KNOWN_MINTS } from "../utils/solana.js";

export interface TokenBalance {
  symbol: string;
  mint: string;
  amount: number;
  decimals: number;
  priceUsd: number;
  valueUsd: number;
}

export interface PortfolioState {
  walletAddress: string;
  solBalance: number;
  solValueUsd: number;
  tokens: Record<string, TokenBalance>;
  totalValueUsd: number;
  timestamp: string;
}

export class WalletMonitor {
  private logger = new Logger("WalletMonitor");
  private connection: Connection;
  private agentPublicKey: PublicKey;
  private isSimulation: boolean;

  // Internal simulated state for simulation mode
  private simulatedBalances: Record<string, number> = {
    SOL: 1.5, // ~ $300 at $200/SOL
    USDC: 120.0,
    jupSOL: 0.25,
    bSOL: 0.1,
  };

  private simulatedPrices: Record<string, number> = {
    SOL: 200.0,
    USDC: 1.0,
    USDT: 1.0,
    jupSOL: 215.0,
    bSOL: 212.0,
  };

  constructor(connection: Connection, agentPublicKey: PublicKey, isSimulation: boolean = true) {
    this.connection = connection;
    this.agentPublicKey = agentPublicKey;
    this.isSimulation = isSimulation;
  }

  public async getPortfolio(): Promise<PortfolioState> {
    if (this.isSimulation) {
      return this.getSimulatedPortfolio();
    }

    try {
      const lamports = await this.connection.getBalance(this.agentPublicKey);
      const solBalance = lamports / 1e9;
      const solPrice = this.simulatedPrices.SOL;
      const solValueUsd = solBalance * solPrice;

      const tokens: Record<string, TokenBalance> = {
        USDC: {
          symbol: "USDC",
          mint: WELL_KNOWN_MINTS.USDC.toBase58(),
          amount: this.simulatedBalances.USDC,
          decimals: 6,
          priceUsd: 1.0,
          valueUsd: this.simulatedBalances.USDC,
        },
      };

      const totalValueUsd = solValueUsd + tokens.USDC.valueUsd;

      return {
        walletAddress: this.agentPublicKey.toBase58(),
        solBalance,
        solValueUsd,
        tokens,
        totalValueUsd,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      this.logger.warn(`Failed to fetch onchain balance, falling back to simulated snapshot: ${(err as Error).message}`);
      return this.getSimulatedPortfolio();
    }
  }

  private getSimulatedPortfolio(): PortfolioState {
    const solBalance = this.simulatedBalances.SOL;
    const solPrice = this.simulatedPrices.SOL;
    const solValueUsd = solBalance * solPrice;

    const tokens: Record<string, TokenBalance> = {};
    let tokensTotalUsd = 0;

    for (const [symbol, amount] of Object.entries(this.simulatedBalances)) {
      if (symbol === "SOL") continue;
      const price = this.simulatedPrices[symbol] || 1.0;
      const val = amount * price;
      tokensTotalUsd += val;
      tokens[symbol] = {
        symbol,
        mint: WELL_KNOWN_MINTS[symbol as keyof typeof WELL_KNOWN_MINTS]?.toBase58() || symbol,
        amount,
        decimals: symbol === "USDC" ? 6 : 9,
        priceUsd: price,
        valueUsd: val,
      };
    }

    const totalValueUsd = solValueUsd + tokensTotalUsd;

    return {
      walletAddress: this.agentPublicKey.toBase58(),
      solBalance,
      solValueUsd,
      tokens,
      totalValueUsd,
      timestamp: new Date().toISOString(),
    };
  }

  public adjustSimulatedBalance(symbol: string, delta: number): void {
    if (this.simulatedBalances[symbol] !== undefined) {
      this.simulatedBalances[symbol] = Math.max(0, this.simulatedBalances[symbol] + delta);
    } else {
      this.simulatedBalances[symbol] = Math.max(0, delta);
    }
  }
}
