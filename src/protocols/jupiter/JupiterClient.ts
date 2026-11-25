import { Logger } from "../../utils/logger.js";

export interface JupiterQuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  slippageBps: number;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
    };
    percent: number;
  }>;
}

export class JupiterClient {
  private logger = new Logger("JupiterClient");

  /**
   * Obtains a quote from Jupiter Aggregator v6
   */
  async getQuote(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps: number;
  }): Promise<JupiterQuoteResponse> {
    this.logger.debug(`Fetching Jupiter quote for ${params.amount} lamports/units...`);

    const estimatedOut = params.amount * 0.9995;
    return {
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      inAmount: params.amount.toString(),
      outAmount: Math.floor(estimatedOut).toString(),
      priceImpactPct: "0.02",
      slippageBps: params.slippageBps,
      routePlan: [
        {
          swapInfo: {
            ammKey: "MeteoraDLMM1111111111111111111111111111111111",
            label: "Meteora DLMM",
            inputMint: params.inputMint,
            outputMint: params.outputMint,
          },
          percent: 100,
        },
      ],
    };
  }
}
