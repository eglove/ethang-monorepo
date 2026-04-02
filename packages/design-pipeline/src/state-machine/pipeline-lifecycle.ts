import isNil from "lodash/isNil.js";
import omit from "lodash/omit.js";

import {
  type HaltReason,
  MAX_PIPELINE_RETRIES,
  MAX_VALIDATION_ATTEMPTS,
  PHASE_1_CLEAR_SET,
  PHASE_3_CLEAR_SET,
  type PipelinePhase,
  TERMINAL_PHASES,
  VALIDATED_PHASES,
} from "./pipeline-phases.js";
import { type PipelineState, PipelineStateSchema } from "./pipeline-state.js";

// --- String constants ---
const TERMINAL_ERROR = "Cannot transition from terminal state";
const INVALID_FORWARD = "Invalid forward transition";
const INVALID_BACKWARD = "Invalid backward transition";
const RETRY_BUDGET_EXHAUSTED = "Retry budget exhausted for target phase";
const EXPERTS_REQUIRED = "Forward to PHASE_2 requires non-empty experts array";
const RETRY_NOT_AT_MAX =
  "RETRY_EXHAUSTED halt requires at least one retry counter at max";
const VALIDATION_NOT_AT_MAX =
  "VALIDATION_EXHAUSTED halt requires validationAttempts at max";
const VALIDATION_AT_MAX = "Validation attempts exhausted";
const VALIDATION_NOT_APPLICABLE =
  "validation_fail not applicable to this phase";
const HALT_NONE_ERROR = "Cannot halt with reason NONE";
const PHASE_2 = "PHASE_2_DESIGN_DEBATE";
const PHASE_1_KEY = "PHASE_1" as const;

// --- Action types ---
export type PipelineAction =
  | { artifacts: Record<string, string>; experts?: string[]; type: "forward" }
  | { reason: HaltReason; type: "halt" }
  | { target: PipelinePhase; type: "backward" }
  | { type: "validation_fail" };

// --- Forward transition table ---
const FORWARD_TABLE: Partial<Record<PipelinePhase, PipelinePhase>> = {
  IDLE: "PHASE_1_QUESTIONER",
  PHASE_1_QUESTIONER: PHASE_2,
  PHASE_2_DESIGN_DEBATE: "PHASE_3_TLA_WRITER",
  PHASE_3_TLA_WRITER: "PHASE_4_TLA_REVIEW",
  PHASE_4_TLA_REVIEW: "PHASE_5_IMPLEMENTATION",
  PHASE_5_IMPLEMENTATION: "PHASE_6_PAIR_PROGRAMMING",
  PHASE_6_PAIR_PROGRAMMING: "COMPLETE",
};

// --- Backward transition table ---
type BackwardEntry = {
  clearSet: "PHASE_1" | "PHASE_3";
  retryKey: "PHASE_1_QUESTIONER" | "PHASE_3_TLA_WRITER";
};

const BACKWARD_TABLE: Partial<
  Record<PipelinePhase, Record<string, BackwardEntry>>
> = {
  PHASE_3_TLA_WRITER: {
    PHASE_1_QUESTIONER: {
      clearSet: PHASE_1_KEY,
      retryKey: "PHASE_1_QUESTIONER",
    },
  },
  PHASE_4_TLA_REVIEW: {
    PHASE_1_QUESTIONER: {
      clearSet: PHASE_1_KEY,
      retryKey: "PHASE_1_QUESTIONER",
    },
    PHASE_3_TLA_WRITER: {
      clearSet: "PHASE_3",
      retryKey: "PHASE_3_TLA_WRITER",
    },
  },
  PHASE_5_IMPLEMENTATION: {
    PHASE_1_QUESTIONER: {
      clearSet: PHASE_1_KEY,
      retryKey: "PHASE_1_QUESTIONER",
    },
    PHASE_3_TLA_WRITER: {
      clearSet: "PHASE_3",
      retryKey: "PHASE_3_TLA_WRITER",
    },
  },
};

// --- Guard functions ---
type TransitionGuard = (state: PipelineState) => boolean;

const hasRetryBudget = (
  retryKey: "PHASE_1_QUESTIONER" | "PHASE_3_TLA_WRITER",
): TransitionGuard => {
  return (state) => {
    const count = state.retries[retryKey] ?? 0;
    return count < MAX_PIPELINE_RETRIES;
  };
};

const anyRetryAtMax: TransitionGuard = (state) => {
  const p1 = state.retries.PHASE_1_QUESTIONER ?? 0;
  const p3 = state.retries.PHASE_3_TLA_WRITER ?? 0;
  return p1 >= MAX_PIPELINE_RETRIES || p3 >= MAX_PIPELINE_RETRIES;
};

const validationAtMax: TransitionGuard = (state) =>
  state.validationAttempts >= MAX_VALIDATION_ATTEMPTS;

const validationBelowMax: TransitionGuard = (state) =>
  state.validationAttempts < MAX_VALIDATION_ATTEMPTS;

const isValidatedPhase: TransitionGuard = (state) =>
  VALIDATED_PHASES.has(state.phase);

// --- isValidPipelineTransition ---
export const isValidPipelineTransition = (
  current: PipelinePhase,
  next: PipelinePhase,
): boolean => {
  if (TERMINAL_PHASES.has(current)) {
    return false;
  }

  const forwardTarget = FORWARD_TABLE[current];
  if (forwardTarget === next) {
    return true;
  }

  const backwardTargets = BACKWARD_TABLE[current];
  if (backwardTargets !== undefined && next in backwardTargets) {
    return true;
  }

  return false;
};

// --- Clear set helpers ---
const getClearSet = (clearSetKey: "PHASE_1" | "PHASE_3") => {
  return PHASE_1_KEY === clearSetKey ? PHASE_1_CLEAR_SET : PHASE_3_CLEAR_SET;
};

// --- Parse helper for safe type narrowing ---
const parseState = (raw: Record<string, unknown>): PipelineState => {
  return PipelineStateSchema.parse(raw);
};

// --- transitionPipeline ---
export const transitionPipeline = (
  state: PipelineState,
  action: PipelineAction,
): { error: string } | PipelineState => {
  if (TERMINAL_PHASES.has(state.phase)) {
    return { error: `${TERMINAL_ERROR}: ${state.phase}` };
  }

  switch (action.type) {
    case "backward": {
      return handleBackward(state, action);
    }

    case "forward": {
      return handleForward(state, action);
    }

    case "halt": {
      return handleHalt(state, action);
    }

    case "validation_fail": {
      return handleValidationFail(state);
    }
  }
};

const handleForward = (
  state: PipelineState,
  action: { artifacts: Record<string, string>; experts?: string[] },
): { error: string } | PipelineState => {
  const nextPhase = FORWARD_TABLE[state.phase];

  /* v8 ignore next 3 -- defensive: all non-terminal phases are in FORWARD_TABLE */
  if (nextPhase === undefined) {
    return { error: INVALID_FORWARD };
  }

  if (
    PHASE_2 === nextPhase &&
    (isNil(action.experts) || 0 === action.experts.length)
  ) {
    return { error: EXPERTS_REQUIRED };
  }

  const newContext = {
    ...state.accumulatedContext,
    ...action.artifacts,
    ...(action.experts === undefined ? {} : { experts: action.experts }),
  };

  return parseState({
    ...state,
    accumulatedContext: newContext,
    haltReason: "NONE",
    phase: nextPhase,
    validationAttempts: 0,
  });
};

const handleBackward = (
  state: PipelineState,
  action: { target: PipelinePhase },
): { error: string } | PipelineState => {
  const backwardTargets = BACKWARD_TABLE[state.phase];

  if (backwardTargets === undefined || !(action.target in backwardTargets)) {
    return { error: INVALID_BACKWARD };
  }

  const entry = backwardTargets[action.target];

  /* v8 ignore next 3 -- defensive: entry guaranteed by `in` check above */
  if (entry === undefined) {
    return { error: INVALID_BACKWARD };
  }

  if (!hasRetryBudget(entry.retryKey)(state)) {
    return { error: RETRY_BUDGET_EXHAUSTED };
  }

  const clearSet = getClearSet(entry.clearSet);
  const keysToOmit = [...clearSet];
  const extraOmit =
    PHASE_1_KEY === entry.clearSet ? [...keysToOmit, "experts"] : keysToOmit;
  const newContext = omit(
    state.accumulatedContext as Record<string, unknown>,
    extraOmit,
  );

  const newRetries = {
    ...state.retries,
    [entry.retryKey]: (state.retries[entry.retryKey] ?? 0) + 1,
  };

  return parseState({
    ...state,
    accumulatedContext: newContext,
    haltReason: "NONE",
    phase: action.target,
    retries: newRetries,
    validationAttempts: 0,
  });
};

const handleHalt = (
  state: PipelineState,
  action: { reason: HaltReason },
): { error: string } | PipelineState => {
  switch (action.reason) {
    case "AGENT_FAILURE":
    case "USER_HALT": {
      return parseState({
        ...state,
        haltReason: action.reason,
        phase: "HALTED",
      });
    }

    case "NONE": {
      return { error: HALT_NONE_ERROR };
    }

    case "RETRY_EXHAUSTED": {
      if (!anyRetryAtMax(state)) {
        return { error: RETRY_NOT_AT_MAX };
      }

      return parseState({
        ...state,
        haltReason: "RETRY_EXHAUSTED",
        phase: "HALTED",
      });
    }

    case "VALIDATION_EXHAUSTED": {
      if (!validationAtMax(state)) {
        return { error: VALIDATION_NOT_AT_MAX };
      }

      return parseState({
        ...state,
        haltReason: "VALIDATION_EXHAUSTED",
        phase: "HALTED",
      });
    }
  }
};

const handleValidationFail = (
  state: PipelineState,
): { error: string } | PipelineState => {
  if (!isValidatedPhase(state)) {
    return { error: VALIDATION_NOT_APPLICABLE };
  }

  if (!validationBelowMax(state)) {
    return { error: VALIDATION_AT_MAX };
  }

  return parseState({
    ...state,
    validationAttempts: state.validationAttempts + 1,
  });
};
