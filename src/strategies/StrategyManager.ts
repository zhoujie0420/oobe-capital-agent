import { IStrategy, StrategyEvaluationContext, StrategySignal } from "./types.js";
import { YieldRebalanceStrategy } from "./YieldRebalanceStrategy.js";
import { SpotMomentumStrategy } from "./SpotMomentumStrategy.js";
import { MultiHopperRouterStrategy } from "./MultiHopperRouter.js";
import { Logger } from "../utils/logger.js";

export class StrategyManager {
  private logger = new Logger("StrategyManager");
  private strategies: IStrategy[] = [];

  constructor() {
    this.strategies = [
      new YieldRebalanceStrategy(),
      new SpotMomentumStrategy(),
      new MultiHopperRouterStrategy(),
    ];
  }

  public registerStrategy(strategy: IStrategy): void {
    this.strategies.push(strategy);
  }

  public async evaluateAll(context: StrategyEvaluationContext): Promise<StrategySignal[]> {
    const signals: StrategySignal[] = [];

    for (const strategy of this.strategies) {
      try {
        const signal = await strategy.evaluate(context);
        if (signal) {
          signals.push(signal);
        }
      } catch (err) {
        this.logger.error(`Error in strategy ${strategy.name}: ${(err as Error).message}`);
      }
    }

    // Sort by weighted confidence (confidence * strategy weight)
    return signals.sort((a, b) => {
      const stratA = this.strategies.find((s) => s.name === a.strategyName);
      const stratB = this.strategies.find((s) => s.name === b.strategyName);
      const scoreA = a.confidence * (stratA?.weight || 0.5);
      const scoreB = b.confidence * (stratB?.weight || 0.5);
      return scoreB - scoreA;
    });
  }
}
