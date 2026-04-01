export type StepState =
  | "ASSIGNED"
  | "CONTRACT_VALIDATE"
  | "GREEN"
  | "HANDSHAKE"
  | "RED"
  | "REFACTOR"
  | "STEP_COMPLETE"
  | "STEP_FAILED"
  | "UNASSIGNED";

export type TransitionContext = {
  contractRetries: number;
  maxContractRetries: number;
  maxTDDCycles: number;
  tddCycle: number;
};

import constant from "lodash/constant.js";

type TransitionGuard = (context: TransitionContext) => boolean;

const ALWAYS: TransitionGuard = constant(true) as TransitionGuard;

const tddCyclesRemaining: TransitionGuard = (context) =>
  context.tddCycle < context.maxTDDCycles;

const tddCyclesExhausted: TransitionGuard = (context) =>
  context.tddCycle >= context.maxTDDCycles;

const contractRetriesRemaining: TransitionGuard = (context) =>
  context.contractRetries < context.maxContractRetries;

const contractRetriesExhausted: TransitionGuard = (context) =>
  context.contractRetries >= context.maxContractRetries;

const transitionTable: Record<string, Record<string, TransitionGuard>> = {
  ASSIGNED: { HANDSHAKE: ALWAYS },
  CONTRACT_VALIDATE: {
    GREEN: ALWAYS,
    HANDSHAKE: contractRetriesRemaining,
    STEP_FAILED: contractRetriesExhausted,
  },
  GREEN: { REFACTOR: ALWAYS },
  HANDSHAKE: {
    RED: tddCyclesRemaining,
    STEP_FAILED: tddCyclesExhausted,
  },
  RED: { CONTRACT_VALIDATE: ALWAYS },
  REFACTOR: {
    HANDSHAKE: tddCyclesRemaining,
    STEP_COMPLETE: ALWAYS,
  },
  UNASSIGNED: { ASSIGNED: ALWAYS },
};

export const isValidTransition = (
  current: StepState,
  next: StepState,
  context: TransitionContext,
): boolean => {
  const targets = transitionTable[current];

  if (targets === undefined) {
    return false;
  }

  const guard = targets[next];

  if (guard === undefined) {
    return false;
  }

  return guard(context);
};
