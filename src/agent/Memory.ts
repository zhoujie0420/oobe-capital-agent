export interface ExecutionRecord {
  id: string;
  timestamp: string;
  strategy: string;
  action: "BUY" | "SELL" | "REBALANCE" | "MULTI_HOP_TRANSFER" | "YIELD_DEPOSIT";
  tokenFrom: string;
  tokenTo: string;
  amountUsd: number;
  signature?: string;
  slippageBps: number;
  status: "SUCCESS" | "FAILED" | "REJECTED_GUARDRAIL";
  notes?: string;
}

export class Memory {
  private history: ExecutionRecord[] = [];
  private totalProfitUsd: number = 0;

  public recordExecution(record: ExecutionRecord): void {
    this.history.push(record);
  }

  public getHistory(): ExecutionRecord[] {
    return [...this.history];
  }

  public getSuccessfulExecutions(): ExecutionRecord[] {
    return this.history.filter((h) => h.status === "SUCCESS");
  }

  public updatePnL(deltaUsd: number): void {
    this.totalProfitUsd += deltaUsd;
  }

  public getTotalPnLUsd(): number {
    return this.totalProfitUsd;
  }
}
