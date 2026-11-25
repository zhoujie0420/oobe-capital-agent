import { Logger } from "../utils/logger.js";

export class JitoProtection {
  private logger = new Logger("JitoProtection");

  // Jito tip accounts on Solana mainnet
  public static readonly TIP_ACCOUNTS = [
    "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
    "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
    "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
    "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
  ];

  /**
   * Computes priority fee or Jito bundle tip in micro-lamports
   */
  public calculateTip(priority: "NORMAL" | "HIGH" | "URGENT" = "NORMAL"): number {
    switch (priority) {
      case "URGENT":
        return 100000; // 0.0001 SOL
      case "HIGH":
        return 50000;  // 0.00005 SOL
      case "NORMAL":
      default:
        return 10000;  // 0.00001 SOL
    }
  }

  public getRandomTipAccount(): string {
    const idx = Math.floor(Math.random() * JitoProtection.TIP_ACCOUNTS.length);
    return JitoProtection.TIP_ACCOUNTS[idx];
  }
}
