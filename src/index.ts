import { loadConfig } from "./config/index.js";
import { CapitalAgent } from "./agent/CapitalAgent.js";
import { Logger } from "./utils/logger.js";

const logger = new Logger("Main");

async function main() {
  logger.info("================================================================================");
  logger.info("  OOBE PROTOCOL - AUTONOMOUS CAPITAL AGENT ON SOLANA (STEVE CAPITAL OS)         ");
  logger.info("================================================================================");

  try {
    const config = loadConfig();
    const agent = new CapitalAgent(config);

    // Graceful shutdown handlers
    const shutdown = () => {
      logger.info("\nReceived termination signal. Shutting down agent gracefully...");
      agent.stop();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    await agent.start();
  } catch (err) {
    logger.error(`Fatal agent crash: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
