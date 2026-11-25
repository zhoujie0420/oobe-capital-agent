import { loadConfig } from "../src/config/index.js";
import { CapitalAgent } from "../src/agent/CapitalAgent.js";
import { Logger } from "../src/utils/logger.js";

const logger = new Logger("DemoSimulation");

async function runDemo() {
  console.log(`
================================================================================
   OOBE PROTOCOL & STEVE CAPITAL - AUTONOMOUS CAPITAL AGENT SIMULATION
================================================================================
  Showcasing:
  - Multi-Strategy Execution (Yield Rebalance, Spot Momentum, MultiHopper)
  - Programmable Guardrails & Risk Enforcer (Drawdown, Slippage, Gas Reserve)
  - MultiHopper Programmable Routing Integration
  - Ace Data Cloud Market Intelligence Signals
  - Steve Arena Verified XP Activity Logging
================================================================================
  `);

  const config = loadConfig();
  // Enforce simulation mode
  config.EXECUTION_MODE = "simulation";

  const agent = new CapitalAgent(config);
  await agent.bootstrap();

  logger.info("\n--- STEP 1: Running First Autonomous Iteration (Yield & Spot Opportunities) ---");
  await agent.runIteration();

  logger.info("\n--- STEP 2: Running Targeted MultiHopper Programmable Route ---");
  const mhRoutePlan = await agent.multihopper.planRoute({
    fromToken: "USDC",
    toToken: "bSOL",
    amount: 25.0,
  });
  const mhSig = await agent.multihopper.executeRoute(mhRoutePlan);
  agent.guardrails.recordExecutedVolume(25.0);
  await agent.steveMcp.recordArenaActivity({
    agentAddress: agent.getPublicKey(),
    action: "MULTI_HOPPER_ROUTING",
    protocol: "MultiHopper",
    amountUsd: 25.0,
    signature: mhSig,
    status: "CONFIRMED",
  });
  agent.memory.recordExecution({
    id: `mh_${Date.now()}`,
    timestamp: new Date().toISOString(),
    strategy: "MultiHopperRouterStrategy",
    action: "MULTI_HOP_TRANSFER",
    tokenFrom: "USDC",
    tokenTo: "bSOL",
    amountUsd: 25.0,
    signature: mhSig,
    slippageBps: 20,
    status: "SUCCESS",
    notes: "Direct MultiHopper programmable multi-hop routing",
  });

  logger.info("\n--- STEP 3: Evaluating Portfolio & Memory Ledger ---");
  const portfolio = await agent.walletMonitor.getPortfolio();
  const history = agent.memory.getHistory();
  const arenaLogs = agent.steveMcp.getArenaActivities();
  const mhRoutes = agent.multihopper.getExecutedRoutes();

  console.log("\n======================== SIMULATION SUMMARY ========================");
  console.log(`Agent Public Key:           ${agent.getPublicKey()}`);
  console.log(`Final Portfolio Value:      $${portfolio.totalValueUsd.toFixed(2)}`);
  console.log(`SOL Gas Reserve:            ${portfolio.solBalance.toFixed(4)} SOL`);
  console.log(`Total Actions Executed:     ${history.filter((h) => h.status === "SUCCESS").length}`);
  console.log(`Total Daily Volume Routed:  $${agent.guardrails.getDailyVolumeUsd().toFixed(2)} / $${config.guardrails.maxDailyVolumeUsd.toFixed(2)}`);
  console.log(`Steve Arena XP Events:      ${arenaLogs.length} verified events logged`);
  console.log(`MultiHopper Routes Routed:  ${mhRoutes.length} route(s) successfully executed`);
  console.log(`MultiHopper Route Volume:   $${agent.multihopper.getTotalVolumeRoutedUsd().toFixed(2)} USD`);
  console.log("====================================================================\n");

  logger.action("Autonomous Agent simulation completed successfully! System healthy.");
}

runDemo().catch((err) => {
  console.error("Simulation error:", err);
  process.exit(1);
});
