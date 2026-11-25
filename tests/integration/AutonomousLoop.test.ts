import { describe, it, expect } from "vitest";
import { CapitalAgent } from "../../src/agent/CapitalAgent.js";
import { loadConfig } from "../../src/config/index.js";

describe("Autonomous Capital Agent Loop Integration", () => {
  it("should complete a full autonomous decision cycle in simulation mode", async () => {
    const config = loadConfig();
    config.EXECUTION_MODE = "simulation";

    const agent = new CapitalAgent(config);
    await agent.bootstrap();

    // Execute one iteration
    await agent.runIteration();

    const history = agent.memory.getHistory();
    expect(history.length).toBeGreaterThan(0);

    const successfulTrades = agent.memory.getSuccessfulExecutions();
    expect(successfulTrades.length).toBeGreaterThan(0);

    const arenaActivities = agent.steveMcp.getArenaActivities();
    expect(arenaActivities.length).toBeGreaterThan(0);
    expect(arenaActivities[0].status).toBe("CONFIRMED");
  });
});
