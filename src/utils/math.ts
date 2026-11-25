export function toBps(percentage: number): number {
  return Math.round(percentage * 100);
}

export function fromBps(bps: number): number {
  return bps / 100;
}

export function roundToDecimals(val: number, decimals: number = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export function calculateSlippageAmount(amount: number, slippageBps: number): number {
  return amount * (1 - slippageBps / 10000);
}

export function calculatePnLPercentage(entryPrice: number, currentPrice: number): number {
  if (entryPrice <= 0) return 0;
  return ((currentPrice - entryPrice) / entryPrice) * 100;
}
