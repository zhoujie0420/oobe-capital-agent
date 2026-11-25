import { describe, it, expect } from "vitest";
import { StateMachine, AgentState } from "../../src/agent/StateMachine.js";

describe("StateMachine", () => {
  it("should initialize with INITIALIZING state", () => {
    const sm = new StateMachine();
    expect(sm.getState()).toBe(AgentState.INITIALIZING);
  });

  it("should transition between states correctly", () => {
    const sm = new StateMachine();
    sm.transition(AgentState.IDLE, "Startup complete");
    expect(sm.getState()).toBe(AgentState.IDLE);

    sm.transition(AgentState.MONITORING);
    expect(sm.getState()).toBe(AgentState.MONITORING);
  });

  it("should freeze transitions when EMERGENCY_STOP is activated", () => {
    const sm = new StateMachine();
    sm.emergencyHalt("Circuit breaker tripped");
    expect(sm.getState()).toBe(AgentState.EMERGENCY_STOP);

    const transitionResult = sm.transition(AgentState.EXECUTING);
    expect(transitionResult).toBe(false);
    expect(sm.getState()).toBe(AgentState.EMERGENCY_STOP);
  });

  it("should invoke registered state listeners", () => {
    const sm = new StateMachine();
    let listenerCalled = false;

    sm.onStateChange((from, to) => {
      if (from === AgentState.INITIALIZING && to === AgentState.IDLE) {
        listenerCalled = true;
      }
    });

    sm.transition(AgentState.IDLE);
    expect(listenerCalled).toBe(true);
  });
});
