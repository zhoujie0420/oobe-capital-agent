"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../src/config/index.js");
const CapitalAgent_js_1 = require("../src/agent/CapitalAgent.js");
const logger_js_1 = require("../src/utils/logger.js");
const logger = new logger_js_1.Logger("DemoSimulation");
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
    const config = (0, index_js_1.loadConfig)();
    // Enforce simulation mode
    config.EXECUTION_MODE = "simulation";
    const agent = new CapitalAgent_js_1.CapitalAgent(config);
    await agent.bootstrap();
    logger.info("\n--- STEP 1: Running First Autonomous Iteration (Yield & Spot Opportunities) ---");
    await agent.runIteration();
    logger.info("\n--- STEP 2: Running Second Autonomous Iteration (MultiHopper Routing) ---");
    await agent.runIteration();
    logger.info("\n--- STEP 3: Evaluating Portfolio & Memory Ledger ---");
    const portfolio = await agent.walletMonitor.getPortfolio();
    const history = agent.memory.getHistory();
    const arenaLogs = agent.steveMcp.getArenaActivities();
    const mhRoutes = agent.multihopper.getExecutedRoutes();
    console.log("\n======================== SIMULATION SUMMARY ========================");
    console.log(`Final Portfolio Value:      $${portfolio.totalValueUsd.toFixed(2)}`);
    console.log(`SOL Gas Reserve:            ${portfolio.solBalance.toFixed(4)} SOL`);
    console.log(`Total Actions Executed:     ${history.filter(h => h.status === 'SUCCESS').length}`);
    console.log(`Total Daily Volume Routed:  $${agent.guardrails.getDailyVolumeUsd().toFixed(2)} / $${config.guardrails.maxDailyVolumeUsd.toFixed(2)}`);
    console.log(`Steve Arena XP Events:      ${arenaLogs.length} verified events logged`);
    console.log(`MultiHopper Routes Routed:  ${mhRoutes.length} route(s) successfully executed`);
    console.log("====================================================================\n");
    logger.action("Autonomous Agent simulation completed successfully! System healthy.");
}
runDemo().catch((err) => {
    console.error("Simulation error:", err);
    process.exit(1);
});
