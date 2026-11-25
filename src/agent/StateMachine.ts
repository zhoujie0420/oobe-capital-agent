import { Logger } from "../utils/logger.js";

export enum AgentState {
  INITIALIZING = "INITIALIZING",
  IDLE = "IDLE",
  MONITORING = "MONITORING",
  EVALUATING = "EVALUATING",
  GUARDRAIL_CHECK = "GUARDRAIL_CHECK",
  EXECUTING = "EXECUTING",
  REBALANCING = "REBALANCING",
  COOLDOWN = "COOLDOWN",
  EMERGENCY_STOP = "EMERGENCY_STOP",
}

export type StateChangeCallback = (from: AgentState, to: AgentState, reason?: string) => void;

export class StateMachine {
  private currentState: AgentState = AgentState.INITIALIZING;
  private logger = new Logger("StateMachine");
  private listeners: StateChangeCallback[] = [];

  constructor(initialState: AgentState = AgentState.INITIALIZING) {
    this.currentState = initialState;
  }

  public getState(): AgentState {
    return this.currentState;
  }

  public transition(newState: AgentState, reason?: string): boolean {
    if (this.currentState === AgentState.EMERGENCY_STOP) {
      this.logger.error(`Cannot transition out of EMERGENCY_STOP. System halted.`);
      return false;
    }

    const oldState = this.currentState;
    this.currentState = newState;

    this.logger.debug(`Transition: [${oldState}] -> [${newState}]${reason ? ` (${reason})` : ""}`);

    for (const listener of this.listeners) {
      try {
        listener(oldState, newState, reason);
      } catch (err) {
        this.logger.error(`Error in state listener: ${(err as Error).message}`);
      }
    }

    return true;
  }

  public onStateChange(callback: StateChangeCallback): void {
    this.listeners.push(callback);
  }

  public emergencyHalt(reason: string): void {
    this.logger.error(`EMERGENCY HALT TRIGGERED: ${reason}`);
    this.transition(AgentState.EMERGENCY_STOP, reason);
  }
}
