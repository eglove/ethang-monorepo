import get from "lodash/get.js";
import { describe, expect, it } from "vitest";

import {
  isValidPipelineTransition,
  type PipelineAction,
  transitionPipeline,
} from "./pipeline-lifecycle.js";
import {
  MAX_PIPELINE_RETRIES,
  MAX_VALIDATION_ATTEMPTS,
} from "./pipeline-phases.js";
import { type PipelineState, PipelineStateSchema } from "./pipeline-state.js";

// --- String constants for repeated literals ---
const TEST_SLUG = "test";
const TEST_BRIEFING = "/artifacts/briefing.md";
const TEST_CONSENSUS = "/artifacts/consensus.md";
const TEST_TLA_SPEC = "/artifacts/spec.tla";
const TEST_TLC_RESULT = "Model checking complete. No errors.";
const TEST_TLA_REVIEW = "/artifacts/review.md";
const TEST_IMPL_PLAN = "/artifacts/impl-plan.md";
const TERMINAL_ERROR = "Cannot transition from terminal state";
const DEFAULT_RETRIES = { PHASE_1_QUESTIONER: 0, PHASE_3_TLA_WRITER: 0 };
const DEFAULT_EXPERTS = ["domain-expert", "security-expert"];

// --- Type guard for error results ---
const isErrorResult = (
  result: { error: string } | PipelineState,
): result is { error: string } => {
  return "error" in result;
};

// --- Helpers for safe result access ---
const expectSuccess = (
  result: { error: string } | PipelineState,
): PipelineState => {
  expect(isErrorResult(result)).toBe(false);
  return PipelineStateSchema.parse(result);
};

const expectError = (
  result: { error: string } | PipelineState,
): { error: string } => {
  if (!isErrorResult(result)) {
    expect.fail("Expected error result but got PipelineState");
  }

  return result;
};

// --- Helper factories ---
const makeIdleState = (slug = TEST_SLUG): PipelineState => {
  return PipelineStateSchema.parse({
    accumulatedContext: {},
    haltReason: "NONE",
    phase: "IDLE",
    retries: DEFAULT_RETRIES,
    slug,
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  });
};

const makePhase1State = (slug = TEST_SLUG): PipelineState => {
  return PipelineStateSchema.parse({
    accumulatedContext: {},
    haltReason: "NONE",
    phase: "PHASE_1_QUESTIONER",
    retries: DEFAULT_RETRIES,
    slug,
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  });
};

const makePhase2State = (slug = TEST_SLUG): PipelineState => {
  return PipelineStateSchema.parse({
    accumulatedContext: {
      briefingPath: TEST_BRIEFING,
      experts: DEFAULT_EXPERTS,
    },
    haltReason: "NONE",
    phase: "PHASE_2_DESIGN_DEBATE",
    retries: DEFAULT_RETRIES,
    slug,
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  });
};

const makePhase3State = (slug = TEST_SLUG): PipelineState => {
  return PipelineStateSchema.parse({
    accumulatedContext: {
      briefingPath: TEST_BRIEFING,
      designConsensusPath: TEST_CONSENSUS,
      experts: DEFAULT_EXPERTS,
    },
    haltReason: "NONE",
    phase: "PHASE_3_TLA_WRITER",
    retries: DEFAULT_RETRIES,
    slug,
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  });
};

const makePhase4State = (slug = TEST_SLUG): PipelineState => {
  return PipelineStateSchema.parse({
    accumulatedContext: {
      briefingPath: TEST_BRIEFING,
      designConsensusPath: TEST_CONSENSUS,
      experts: DEFAULT_EXPERTS,
      tlaSpecPath: TEST_TLA_SPEC,
      tlcResult: TEST_TLC_RESULT,
    },
    haltReason: "NONE",
    phase: "PHASE_4_TLA_REVIEW",
    retries: DEFAULT_RETRIES,
    slug,
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  });
};

const makePhase5State = (slug = TEST_SLUG): PipelineState => {
  return PipelineStateSchema.parse({
    accumulatedContext: {
      briefingPath: TEST_BRIEFING,
      designConsensusPath: TEST_CONSENSUS,
      experts: DEFAULT_EXPERTS,
      tlaReviewPath: TEST_TLA_REVIEW,
      tlaSpecPath: TEST_TLA_SPEC,
      tlcResult: TEST_TLC_RESULT,
    },
    haltReason: "NONE",
    phase: "PHASE_5_IMPLEMENTATION",
    retries: DEFAULT_RETRIES,
    slug,
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  });
};

const makePhase6State = (slug = TEST_SLUG): PipelineState => {
  return PipelineStateSchema.parse({
    accumulatedContext: {
      briefingPath: TEST_BRIEFING,
      designConsensusPath: TEST_CONSENSUS,
      experts: DEFAULT_EXPERTS,
      implementationPlanPath: TEST_IMPL_PLAN,
      tlaReviewPath: TEST_TLA_REVIEW,
      tlaSpecPath: TEST_TLA_SPEC,
      tlcResult: TEST_TLC_RESULT,
    },
    haltReason: "NONE",
    phase: "PHASE_6_PAIR_PROGRAMMING",
    retries: DEFAULT_RETRIES,
    slug,
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  });
};

const makeCompleteState = (slug = TEST_SLUG): PipelineState => {
  return PipelineStateSchema.parse({
    accumulatedContext: {
      briefingPath: TEST_BRIEFING,
      designConsensusPath: TEST_CONSENSUS,
      experts: DEFAULT_EXPERTS,
      implementationPlanPath: TEST_IMPL_PLAN,
      tlaReviewPath: TEST_TLA_REVIEW,
      tlaSpecPath: TEST_TLA_SPEC,
      tlcResult: TEST_TLC_RESULT,
    },
    haltReason: "NONE",
    phase: "COMPLETE",
    retries: DEFAULT_RETRIES,
    slug,
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  });
};

const makeHaltedState = (slug = TEST_SLUG): PipelineState => {
  return PipelineStateSchema.parse({
    accumulatedContext: {},
    haltReason: "USER_HALT",
    phase: "HALTED",
    retries: DEFAULT_RETRIES,
    slug,
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  });
};

// --- Forward transitions (9 tests) ---
const describeForwardTransitions = (): void => {
  describe("forward transitions", () => {
    it("1: IDLE -> PHASE_1 succeeds unconditionally", () => {
      const action: PipelineAction = { artifacts: {}, type: "forward" };
      const result = expectSuccess(transitionPipeline(makeIdleState(), action));

      expect(result.phase).toBe("PHASE_1_QUESTIONER");
    });

    it("2: PHASE_1 -> PHASE_2 succeeds when providing briefingPath and experts", () => {
      const action: PipelineAction = {
        artifacts: { briefingPath: TEST_BRIEFING },
        experts: DEFAULT_EXPERTS,
        type: "forward",
      };
      const result = expectSuccess(
        transitionPipeline(makePhase1State(), action),
      );

      expect(result.phase).toBe("PHASE_2_DESIGN_DEBATE");
      expect(get(result, ["accumulatedContext", "briefingPath"])).toBe(
        TEST_BRIEFING,
      );
      expect(get(result, ["accumulatedContext", "experts"])).toBeDefined();
    });

    it("3: PHASE_1 -> PHASE_2 fails when experts is empty", () => {
      const action: PipelineAction = {
        artifacts: { briefingPath: TEST_BRIEFING },
        experts: [],
        type: "forward",
      };
      expectError(transitionPipeline(makePhase1State(), action));
    });

    it("4: PHASE_2 -> PHASE_3 succeeds with designConsensusPath", () => {
      const action: PipelineAction = {
        artifacts: { designConsensusPath: TEST_CONSENSUS },
        type: "forward",
      };
      const result = expectSuccess(
        transitionPipeline(makePhase2State(), action),
      );

      expect(result.phase).toBe("PHASE_3_TLA_WRITER");
      expect(get(result, ["accumulatedContext", "designConsensusPath"])).toBe(
        TEST_CONSENSUS,
      );
    });

    it("5: PHASE_3 -> PHASE_4 succeeds with tlaSpecPath and tlcResult", () => {
      const action: PipelineAction = {
        artifacts: { tlaSpecPath: TEST_TLA_SPEC, tlcResult: TEST_TLC_RESULT },
        type: "forward",
      };
      const result = expectSuccess(
        transitionPipeline(makePhase3State(), action),
      );

      expect(result.phase).toBe("PHASE_4_TLA_REVIEW");
      expect(get(result, ["accumulatedContext", "tlaSpecPath"])).toBe(
        TEST_TLA_SPEC,
      );
      expect(get(result, ["accumulatedContext", "tlcResult"])).toBe(
        TEST_TLC_RESULT,
      );
    });

    it("6: PHASE_4 -> PHASE_5 succeeds with tlaReviewPath", () => {
      const action: PipelineAction = {
        artifacts: { tlaReviewPath: TEST_TLA_REVIEW },
        type: "forward",
      };
      const result = expectSuccess(
        transitionPipeline(makePhase4State(), action),
      );

      expect(result.phase).toBe("PHASE_5_IMPLEMENTATION");
      expect(get(result, ["accumulatedContext", "tlaReviewPath"])).toBe(
        TEST_TLA_REVIEW,
      );
    });

    it("7: PHASE_5 -> PHASE_6 succeeds with implementationPlanPath", () => {
      const action: PipelineAction = {
        artifacts: { implementationPlanPath: TEST_IMPL_PLAN },
        type: "forward",
      };
      const result = expectSuccess(
        transitionPipeline(makePhase5State(), action),
      );

      expect(result.phase).toBe("PHASE_6_PAIR_PROGRAMMING");
      expect(
        get(result, ["accumulatedContext", "implementationPlanPath"]),
      ).toBe(TEST_IMPL_PLAN);
    });

    it("8: PHASE_6 -> COMPLETE succeeds unconditionally", () => {
      const action: PipelineAction = { artifacts: {}, type: "forward" };
      const result = expectSuccess(
        transitionPipeline(makePhase6State(), action),
      );

      expect(result.phase).toBe("COMPLETE");
    });

    it("9: each forward transition resets validationAttempts to 0", () => {
      const state = PipelineStateSchema.parse({
        ...makePhase2State(),
        validationAttempts: 2,
      });
      const action: PipelineAction = {
        artifacts: { designConsensusPath: TEST_CONSENSUS },
        type: "forward",
      };
      const result = expectSuccess(transitionPipeline(state, action));

      expect(result.validationAttempts).toBe(0);
    });
  });
};

// --- Backward transitions (5 tests) ---
const describeBackwardTransitions = (): void => {
  describe("backward transitions", () => {
    it("10: PHASE_3 -> PHASE_1 clears all artifacts, clears experts, increments retries", () => {
      const action: PipelineAction = {
        target: "PHASE_1_QUESTIONER",
        type: "backward",
      };
      const result = expectSuccess(
        transitionPipeline(makePhase3State(), action),
      );

      expect(result.phase).toBe("PHASE_1_QUESTIONER");
      expect(result.accumulatedContext).toEqual({});
      expect(result.retries.PHASE_1_QUESTIONER).toBe(1);
    });

    it("11: PHASE_4 -> PHASE_3 clears tla artifacts, preserves briefingPath/designConsensusPath", () => {
      const action: PipelineAction = {
        target: "PHASE_3_TLA_WRITER",
        type: "backward",
      };
      const result = expectSuccess(
        transitionPipeline(makePhase4State(), action),
      );

      expect(result.phase).toBe("PHASE_3_TLA_WRITER");
      expect(get(result, ["accumulatedContext", "briefingPath"])).toBe(
        TEST_BRIEFING,
      );
      expect(get(result, ["accumulatedContext", "designConsensusPath"])).toBe(
        TEST_CONSENSUS,
      );
      expect(
        get(result, ["accumulatedContext", "tlaSpecPath"]),
      ).toBeUndefined();
      expect(get(result, ["accumulatedContext", "tlcResult"])).toBeUndefined();
      expect(result.retries.PHASE_3_TLA_WRITER).toBe(1);
    });

    it("12: PHASE_4 -> PHASE_1 clears all, increments retries[PHASE_1]", () => {
      const action: PipelineAction = {
        target: "PHASE_1_QUESTIONER",
        type: "backward",
      };
      const result = expectSuccess(
        transitionPipeline(makePhase4State(), action),
      );

      expect(result.phase).toBe("PHASE_1_QUESTIONER");
      expect(result.accumulatedContext).toEqual({});
      expect(result.retries.PHASE_1_QUESTIONER).toBe(1);
    });

    it("13: backward transition blocked when retries at max", () => {
      const state = PipelineStateSchema.parse({
        ...makePhase3State(),
        retries: {
          PHASE_1_QUESTIONER: MAX_PIPELINE_RETRIES,
          PHASE_3_TLA_WRITER: 0,
        },
      });
      const action: PipelineAction = {
        target: "PHASE_1_QUESTIONER",
        type: "backward",
      };
      expectError(transitionPipeline(state, action));
    });

    it("14a: backward with retries undefined defaults to 0 and increments", () => {
      const state = PipelineStateSchema.parse({
        ...makePhase3State(),
        retries: {},
      });
      const action: PipelineAction = {
        target: "PHASE_1_QUESTIONER",
        type: "backward",
      };
      const result = expectSuccess(transitionPipeline(state, action));

      expect(result.phase).toBe("PHASE_1_QUESTIONER");
      expect(result.retries.PHASE_1_QUESTIONER).toBe(1);
    });

    it("14: backward transitions reset validationAttempts to 0", () => {
      const state = PipelineStateSchema.parse({
        ...makePhase4State(),
        validationAttempts: 2,
      });
      const action: PipelineAction = {
        target: "PHASE_3_TLA_WRITER",
        type: "backward",
      };
      const result = expectSuccess(transitionPipeline(state, action));

      expect(result.validationAttempts).toBe(0);
    });
  });
};

// --- Halt transitions (6 tests) ---
const describeHaltTransitions = (): void => {
  describe("halt transitions", () => {
    it("15: USER_HALT from non-terminal succeeds", () => {
      const action: PipelineAction = { reason: "USER_HALT", type: "halt" };
      const result = expectSuccess(
        transitionPipeline(makePhase2State(), action),
      );

      expect(result.phase).toBe("HALTED");
      expect(result.haltReason).toBe("USER_HALT");
    });

    it("16: AGENT_FAILURE from non-terminal succeeds", () => {
      const action: PipelineAction = {
        reason: "AGENT_FAILURE",
        type: "halt",
      };
      const result = expectSuccess(
        transitionPipeline(makePhase3State(), action),
      );

      expect(result.phase).toBe("HALTED");
      expect(result.haltReason).toBe("AGENT_FAILURE");
    });

    it("17: RETRY_EXHAUSTED succeeds when retry counter at max", () => {
      const state = PipelineStateSchema.parse({
        ...makePhase3State(),
        retries: {
          PHASE_1_QUESTIONER: MAX_PIPELINE_RETRIES,
          PHASE_3_TLA_WRITER: 0,
        },
      });
      const action: PipelineAction = {
        reason: "RETRY_EXHAUSTED",
        type: "halt",
      };
      const result = expectSuccess(transitionPipeline(state, action));

      expect(result.phase).toBe("HALTED");
      expect(result.haltReason).toBe("RETRY_EXHAUSTED");
    });

    it("18: RETRY_EXHAUSTED fails when no counter at max", () => {
      const action: PipelineAction = {
        reason: "RETRY_EXHAUSTED",
        type: "halt",
      };
      expectError(transitionPipeline(makePhase3State(), action));
    });

    it("18a: RETRY_EXHAUSTED fails when retries are undefined (defaults to 0)", () => {
      const state = PipelineStateSchema.parse({
        ...makePhase3State(),
        retries: {},
      });
      const action: PipelineAction = {
        reason: "RETRY_EXHAUSTED",
        type: "halt",
      };
      expectError(transitionPipeline(state, action));
    });

    it("19: VALIDATION_EXHAUSTED succeeds when validationAttempts at max", () => {
      const state = PipelineStateSchema.parse({
        ...makePhase2State(),
        validationAttempts: MAX_VALIDATION_ATTEMPTS,
      });
      const action: PipelineAction = {
        reason: "VALIDATION_EXHAUSTED",
        type: "halt",
      };
      const result = expectSuccess(transitionPipeline(state, action));

      expect(result.phase).toBe("HALTED");
      expect(result.haltReason).toBe("VALIDATION_EXHAUSTED");
    });

    it("20: VALIDATION_EXHAUSTED fails when validationAttempts below max", () => {
      const action: PipelineAction = {
        reason: "VALIDATION_EXHAUSTED",
        type: "halt",
      };
      expectError(transitionPipeline(makePhase2State(), action));
    });
  });
};

// --- Validation failure (3 tests) ---
const describeValidationFailure = (): void => {
  describe("validation failure", () => {
    it("21: from validated phase — phase stays, validationAttempts increments", () => {
      const action: PipelineAction = { type: "validation_fail" };
      const result = expectSuccess(
        transitionPipeline(makePhase2State(), action),
      );

      expect(result.phase).toBe("PHASE_2_DESIGN_DEBATE");
      expect(result.validationAttempts).toBe(1);
    });

    it("22: blocked when validationAttempts at max", () => {
      const state = PipelineStateSchema.parse({
        ...makePhase2State(),
        validationAttempts: MAX_VALIDATION_ATTEMPTS,
      });
      expectError(transitionPipeline(state, { type: "validation_fail" }));
    });

    it("23: from non-validated phase (IDLE, PHASE_6) returns error", () => {
      expectError(
        transitionPipeline(makeIdleState(), { type: "validation_fail" }),
      );
      expectError(
        transitionPipeline(makePhase6State(), { type: "validation_fail" }),
      );
    });
  });
};

// --- Terminal states and invalid transitions (4 tests) ---
const describeTerminalAndInvalid = (): void => {
  describe("terminal states", () => {
    it("24: any action from COMPLETE returns error", () => {
      const state = makeCompleteState();
      const actions: PipelineAction[] = [
        { artifacts: {}, type: "forward" },
        { target: "PHASE_1_QUESTIONER", type: "backward" },
        { reason: "USER_HALT", type: "halt" },
        { type: "validation_fail" },
      ];

      for (const action of actions) {
        const result = expectError(transitionPipeline(state, action));
        expect(result.error).toContain(TERMINAL_ERROR);
      }
    });

    it("25: any action from HALTED returns error", () => {
      const state = makeHaltedState();
      const actions: PipelineAction[] = [
        { artifacts: {}, type: "forward" },
        { target: "PHASE_1_QUESTIONER", type: "backward" },
        { reason: "USER_HALT", type: "halt" },
        { type: "validation_fail" },
      ];

      for (const action of actions) {
        const result = expectError(transitionPipeline(state, action));
        expect(result.error).toContain(TERMINAL_ERROR);
      }
    });

    it("26: PHASE_1 -> PHASE_3 (skip) returns error", () => {
      expect(
        isValidPipelineTransition("PHASE_1_QUESTIONER", "PHASE_3_TLA_WRITER"),
      ).toBe(false);
    });
  });

  describe("invalid transitions", () => {
    it("27: PHASE_2 backward returns error (not a valid backward source)", () => {
      const action: PipelineAction = {
        target: "PHASE_1_QUESTIONER",
        type: "backward",
      };
      expectError(transitionPipeline(makePhase2State(), action));
    });
  });
};

// --- Additional coverage: isValidPipelineTransition branches ---
const describeIsValidPipelineTransition = (): void => {
  describe("isValidPipelineTransition", () => {
    it("returns true for valid forward transition", () => {
      expect(isValidPipelineTransition("IDLE", "PHASE_1_QUESTIONER")).toBe(
        true,
      );
    });

    it("returns true for valid backward transition", () => {
      expect(
        isValidPipelineTransition("PHASE_4_TLA_REVIEW", "PHASE_3_TLA_WRITER"),
      ).toBe(true);
    });

    it("returns false from COMPLETE (terminal)", () => {
      expect(isValidPipelineTransition("COMPLETE", "PHASE_1_QUESTIONER")).toBe(
        false,
      );
    });

    it("returns false from HALTED (terminal)", () => {
      expect(isValidPipelineTransition("HALTED", "IDLE")).toBe(false);
    });

    it("halt with reason NONE returns error", () => {
      const action: PipelineAction = { reason: "NONE", type: "halt" };
      expectError(transitionPipeline(makePhase1State(), action));
    });
  });
};

describe("pipeline lifecycle state machine", () => {
  describeForwardTransitions();
  describeBackwardTransitions();
  describeHaltTransitions();
  describeValidationFailure();
  describeTerminalAndInvalid();
  describeIsValidPipelineTransition();
});
