import { describe, it, expect } from "vitest";
import { GuardrailEnforcer } from "../../src/protocols/oobe/GuardrailEnforcer.js";
import { DEFAULT_GUARDRAILS } from "../../src/config/guardrails.js";

describe("GuardrailEnforcer", () => {
  it("should allow compliant actions within limits", () => {
    const enforcer = new GuardrailEnforcer(DEFAULT_GUARDRAILS);
    const result = enforcer.validateAction({
      protocol: "Jupiter",
      tokenSymbol: "USDC",
      amountUsd: 25.0,
      slippageBps: 20,
      currentSolBalance: 0.5,
    });

    expect(result.allowed).toBe(true);
  });

  it("should reject trade exceeding max allocation limit", () => {
    const enforcer = new GuardrailEnforcer(DEFAULT_GUARDRAILS);
    const result = enforcer.validateAction({
      protocol: "Jupiter",
      tokenSymbol: "USDC",
      amountUsd: 150.0, // Limit is $50
      slippageBps: 20,
      currentSolBalance: 0.5,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("exceeds max single allocation limit");
  });

  it("should reject protocol not in whitelist", () => {
    const enforcer = new GuardrailEnforcer(DEFAULT_GUARDRAILS);
    const result = enforcer.validateAction({
      protocol: "UntrustedDex",
      tokenSymbol: "USDC",
      amountUsd: 10.0,
      slippageBps: 20,
      currentSolBalance: 0.5,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("not in OOBE allowed list");
  });

  it("should reject action when SOL gas reserve is insufficient", () => {
    const enforcer = new GuardrailEnforcer(DEFAULT_GUARDRAILS);
    const result = enforcer.validateAction({
      protocol: "Jupiter",
      tokenSymbol: "USDC",
      amountUsd: 10.0,
      slippageBps: 20,
      currentSolBalance: 0.01, // Minimum is 0.05
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("below required gas reserve");
  });

  it("should trigger circuit breaker on excessive drawdown", () => {
    const enforcer = new GuardrailEnforcer(DEFAULT_GUARDRAILS);
    enforcer.updatePeakPortfolioValue(100.0);

    // 15% drawdown (peak $100 -> current $85) exceeds 10% limit
    const drawdownResult = enforcer.checkDrawdown(85.0);
    expect(drawdownResult.allowed).toBe(false);
    expect(drawdownResult.reason).toContain("Circuit Breaker Triggered");
  });
});
