import { Connection, Keypair } from "@solana/web3.js";
import { AgentConfig } from "../config/index.js";
import { Logger } from "../utils/logger.js";
import { loadKeypair, shortenAddress } from "../utils/solana.js";
import { StateMachine, AgentState } from "./StateMachine.js";
import { WalletMonitor } from "./WalletMonitor.js";
import { Memory } from "./Memory.js";
import { GuardrailEnforcer } from "../protocols/oobe/GuardrailEnforcer.js";
import { SteveMcpClient } from "../protocols/oobe/SteveMcpClient.js";
import { MultiHopperClient } from "../protocols/multihopper/MultiHopperClient.js";
import { AceMarketIntelligence } from "../protocols/acedata/AceMarketIntelligence.js";
import { StrategyManager } from "../strategies/StrategyManager.js";
import { SolanaExecutor } from "../execution/SolanaExecutor.js";

export class CapitalAgent {
  private logger = new Logger("CapitalAgent");
  private config: AgentConfig;
  private connection: Connection;
  private keypair: Keypair;

  public stateMachine: StateMachine;
  public walletMonitor: WalletMonitor;
  public memory: Memory;
  public guardrails: GuardrailEnforcer;
  public steveMcp: SteveMcpClient;
  public multihopper: MultiHopperClient;
  public aceIntelligence: AceMarketIntelligence;
  public strategyManager: StrategyManager;
  public executor: SolanaExecutor;

  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(config: AgentConfig) {
    this.config = config;
    this.logger.info("Initializing OOBE Autonomous Solana Capital Agent...");

    this.connection = new Connection(config.SOLANA_RPC_URL, "confirmed");
    this.keypair = loadKeypair(config.AGENT_PRIVATE_KEY);

    this.stateMachine = new StateMachine(AgentState.INITIALIZING);
    this.walletMonitor = new WalletMonitor(
      this.connection,
      this.keypair.publicKey,
      config.EXECUTION_MODE === "simulation"
    );
    this.memory = new Memory();
    this.guardrails = new GuardrailEnforcer(config.guardrails);
    this.steveMcp = new SteveMcpClient(config.STEVE_MCP_ENDPOINT);
    this.multihopper = new MultiHopperClient(config.MULTI_HOPPER_API_URL);
    this.aceIntelligence = new AceMarketIntelligence(config.ACE_DATA_CLOUD_API_KEY);
    this.strategyManager = new StrategyManager();
    this.executor = new SolanaExecutor(
      this.connection,
      this.keypair,
      config.EXECUTION_MODE === "simulation",
      config.guardrails.maxSlippageBps
    );

    this.logger.info(`Agent Address: ${this.keypair.publicKey.toBase58()} (${shortenAddress(this.keypair.publicKey)})`);
    this.logger.info(`Execution Mode: [${config.EXECUTION_MODE.toUpperCase()}]`);

    this.stateMachine.transition(AgentState.IDLE, "Agent initialized successfully");
  }

  public getPublicKey(): string {
    return this.keypair.publicKey.toBase58();
  }

  public async bootstrap(): Promise<void> {
    await this.steveMcp.registerAgent(this.keypair.publicKey.toBase58(), [
      "OOBE_SAP_MCP_CORE",
      "CAPITAL_ALLOCATION",
      "YIELD_REBALANCING",
      "MULTI_HOPPER_ROUTING",
      "ACE_MARKET_INTELLIGENCE",
    ]);
  }

  /**
   * Executes a single iteration of the autonomous capital agent decision loop
   */
  public async runIteration(): Promise<void> {
    if (this.stateMachine.getState() === AgentState.EMERGENCY_STOP) {
      this.logger.error("Agent in EMERGENCY_STOP state. Skipping iteration.");
      return;
    }

    try {
      // 1. MONITORING STATE
      this.stateMachine.transition(AgentState.MONITORING, "Reading wallet balances & positions");
      const portfolio = await this.walletMonitor.getPortfolio();
      this.logger.info(`Portfolio Valuation: $${portfolio.totalValueUsd.toFixed(2)} (SOL: ${portfolio.solBalance.toFixed(4)}, USDC: ${portfolio.tokens.USDC?.amount.toFixed(2) || "0"})`);

      // Update peak portfolio value for drawdown guardrail check
      this.guardrails.updatePeakPortfolioValue(portfolio.totalValueUsd);
      const drawdownCheck = this.guardrails.checkDrawdown(portfolio.totalValueUsd);
      if (!drawdownCheck.allowed) {
        this.stateMachine.emergencyHalt(drawdownCheck.reason || "Drawdown exceeded limit");
        return;
      }

      // Fetch Ace Data Cloud market signals
      const marketSignal = await this.aceIntelligence.fetchMarketSignals();

      // 2. EVALUATING STATE
      this.stateMachine.transition(AgentState.EVALUATING, "Analyzing market signals & strategy conviction");
      const signals = await this.strategyManager.evaluateAll({
        portfolioTotalUsd: portfolio.totalValueUsd,
        solBalance: portfolio.solBalance,
        tokenBalances: portfolio.tokens,
        marketSentiment: marketSignal.sentiment,
        volatilityIndex: marketSignal.volatilityIndex,
      });

      if (signals.length === 0) {
        this.logger.info("No actionable strategy signals triggered this cycle.");
        this.stateMachine.transition(AgentState.COOLDOWN, "Cycle finished without actions");
        return;
      }

      this.logger.info(`Generated ${signals.length} high-conviction strategy signal(s).`);

      // 3. GUARDRAIL CHECK & EXECUTION
      for (const signal of signals.slice(0, this.config.MAX_CONCURRENT_ACTIONS)) {
        this.stateMachine.transition(AgentState.GUARDRAIL_CHECK, `Checking guardrails for ${signal.strategyName}`);

        const guardrailCheck = this.guardrails.validateAction({
          protocol: signal.targetProtocol,
          tokenSymbol: signal.sourceToken,
          amountUsd: signal.allocationAmountUsd,
          slippageBps: signal.maxSlippageBps,
          currentSolBalance: portfolio.solBalance,
        });

        if (!guardrailCheck.allowed) {
          this.logger.warn(`Guardrail rejected signal: ${guardrailCheck.reason}`);
          this.memory.recordExecution({
            id: `rej_${Date.now()}`,
            timestamp: new Date().toISOString(),
            strategy: signal.strategyName,
            action: "REBALANCE",
            tokenFrom: signal.sourceToken,
            tokenTo: signal.destinationToken,
            amountUsd: signal.allocationAmountUsd,
            slippageBps: signal.maxSlippageBps,
            status: "REJECTED_GUARDRAIL",
            notes: guardrailCheck.reason,
          });
          continue;
        }

        // Execute action
        this.stateMachine.transition(AgentState.EXECUTING, `Executing ${signal.actionType} on ${signal.targetProtocol}`);

        let txSignature: string | undefined;

        if (signal.actionType === "MULTI_HOPPER_ROUTING") {
          // MultiHopper execution path
          const routePlan = await this.multihopper.planRoute({
            fromToken: signal.sourceToken,
            toToken: signal.destinationToken,
            amount: signal.allocationAmountUsd,
          });
          txSignature = await this.multihopper.executeRoute(routePlan);

          this.walletMonitor.adjustSimulatedBalance("USDC", -signal.allocationAmountUsd);
          this.walletMonitor.adjustSimulatedBalance("bSOL", signal.allocationAmountUsd / 210);
        } else {
          // Standard DEX / Yield execution path
          const execResult = await this.executor.executeSignal(signal);
          txSignature = execResult.signature;

          if (execResult.success) {
            this.walletMonitor.adjustSimulatedBalance("USDC", -signal.allocationAmountUsd);
            this.walletMonitor.adjustSimulatedBalance(signal.destinationToken, signal.allocationAmountUsd / 200);
          }
        }

        // Record volume & log to Steve Arena for XP
        this.guardrails.recordExecutedVolume(signal.allocationAmountUsd);
        await this.steveMcp.recordArenaActivity({
          agentAddress: this.keypair.publicKey.toBase58(),
          action: signal.actionType,
          protocol: signal.targetProtocol,
          amountUsd: signal.allocationAmountUsd,
          signature: txSignature,
          status: "CONFIRMED",
        });

        this.memory.recordExecution({
          id: `exec_${Date.now()}`,
          timestamp: new Date().toISOString(),
          strategy: signal.strategyName,
          action: "REBALANCE",
          tokenFrom: signal.sourceToken,
          tokenTo: signal.destinationToken,
          amountUsd: signal.allocationAmountUsd,
          signature: txSignature,
          slippageBps: signal.maxSlippageBps,
          status: "SUCCESS",
          notes: signal.rationale,
        });
      }

      // 4. COOLDOWN STATE
      this.stateMachine.transition(AgentState.COOLDOWN, "Cycle completed; waiting for next tick");
    } catch (err) {
      this.logger.error(`Error during autonomous iteration: ${(err as Error).message}`);
      this.stateMachine.transition(AgentState.IDLE, "Recovered to IDLE after error");
    }
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    await this.bootstrap();

    this.logger.action(`Autonomous Capital Agent Started. Loop interval: ${this.config.POLL_INTERVAL_MS}ms`);

    const loop = async () => {
      if (!this.isRunning) return;
      await this.runIteration();
      if (this.isRunning) {
        this.timer = setTimeout(loop, this.config.POLL_INTERVAL_MS);
      }
    };

    loop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.logger.info("Autonomous Capital Agent stopped.");
  }
}
