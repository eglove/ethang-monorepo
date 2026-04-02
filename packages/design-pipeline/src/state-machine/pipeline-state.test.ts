import get from "lodash/get.js";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  MAX_PIPELINE_RETRIES,
  MAX_VALIDATION_ATTEMPTS,
} from "./pipeline-phases.js";
import { type PipelineState, PipelineStateSchema } from "./pipeline-state.js";

const SLUG = "test-project";
const STARTED_AT = "2026-04-01T09:30:00Z";
const BRIEFING_PATH = "/docs/briefing.md";
const DESIGN_CONSENSUS_PATH = "/docs/consensus.md";
const TLA_SPEC_PATH = "/docs/spec.tla";
const TLC_RESULT = "PASS";
const TLA_REVIEW_PATH = "/docs/review.md";
const IMPLEMENTATION_PLAN_PATH = "/docs/plan.md";
const ACCUMULATED_CONTEXT = "accumulatedContext";

const BASE_FIELDS = {
  haltReason: "NONE" as const,
  retries: {},
  slug: SLUG,
  startedAt: STARTED_AT,
  validationAttempts: 0,
};

const FULL_CONTEXT = {
  briefingPath: BRIEFING_PATH,
  designConsensusPath: DESIGN_CONSENSUS_PATH,
  experts: ["Alice"],
  implementationPlanPath: IMPLEMENTATION_PLAN_PATH,
  tlaReviewPath: TLA_REVIEW_PATH,
  tlaSpecPath: TLA_SPEC_PATH,
  tlcResult: TLC_RESULT,
};

const parseState = (input: Record<string, unknown>): PipelineState =>
  PipelineStateSchema.parse(input);

describe("PipelineStateSchema — early phases", () => {
  it("IDLE state with empty context parses successfully", () => {
    const result = parseState({
      ...BASE_FIELDS,
      accumulatedContext: {},
      phase: "IDLE",
    });

    expect(result.phase).toBe("IDLE");
    expect(result.accumulatedContext).toStrictEqual({});
  });

  it("PHASE_1 state with empty accumulatedContext parses", () => {
    const result = parseState({
      ...BASE_FIELDS,
      accumulatedContext: {},
      phase: "PHASE_1_QUESTIONER",
    });

    expect(result.phase).toBe("PHASE_1_QUESTIONER");
    expect(result.accumulatedContext).toStrictEqual({});
  });

  it("PHASE_2 state requires briefingPath and experts — present input parses", () => {
    const result = parseState({
      ...BASE_FIELDS,
      accumulatedContext: {
        briefingPath: BRIEFING_PATH,
        experts: ["Alice", "Bob"],
      },
      phase: "PHASE_2_DESIGN_DEBATE",
    });

    expect(result.phase).toBe("PHASE_2_DESIGN_DEBATE");
    expect(get(result, [ACCUMULATED_CONTEXT, "briefingPath"])).toBe(
      BRIEFING_PATH,
    );
  });

  it("PHASE_2 state missing briefingPath fails with ZodError", () => {
    expect(() => {
      parseState({
        ...BASE_FIELDS,
        accumulatedContext: { experts: ["Alice"] },
        phase: "PHASE_2_DESIGN_DEBATE",
      });
    }).toThrow(ZodError);
  });

  it("PHASE_2 state with empty experts array fails", () => {
    expect(() => {
      parseState({
        ...BASE_FIELDS,
        accumulatedContext: { briefingPath: BRIEFING_PATH, experts: [] },
        phase: "PHASE_2_DESIGN_DEBATE",
      });
    }).toThrow(ZodError);
  });
});

describe("PipelineStateSchema — middle phases", () => {
  it("PHASE_3 state with all required context parses", () => {
    const result = parseState({
      ...BASE_FIELDS,
      accumulatedContext: {
        briefingPath: BRIEFING_PATH,
        designConsensusPath: DESIGN_CONSENSUS_PATH,
        experts: ["Alice"],
      },
      phase: "PHASE_3_TLA_WRITER",
    });

    expect(result.phase).toBe("PHASE_3_TLA_WRITER");
    expect(get(result, [ACCUMULATED_CONTEXT, "designConsensusPath"])).toBe(
      DESIGN_CONSENSUS_PATH,
    );
  });

  it("PHASE_3 state missing designConsensusPath fails", () => {
    expect(() => {
      parseState({
        ...BASE_FIELDS,
        accumulatedContext: {
          briefingPath: BRIEFING_PATH,
          experts: ["Alice"],
        },
        phase: "PHASE_3_TLA_WRITER",
      });
    }).toThrow(ZodError);
  });

  it("PHASE_4 state with tlaSpecPath and tlcResult parses", () => {
    const result = parseState({
      ...BASE_FIELDS,
      accumulatedContext: {
        briefingPath: BRIEFING_PATH,
        designConsensusPath: DESIGN_CONSENSUS_PATH,
        experts: ["Alice"],
        tlaSpecPath: TLA_SPEC_PATH,
        tlcResult: TLC_RESULT,
      },
      phase: "PHASE_4_TLA_REVIEW",
    });

    expect(result.phase).toBe("PHASE_4_TLA_REVIEW");
    expect(get(result, [ACCUMULATED_CONTEXT, "tlaSpecPath"])).toBe(
      TLA_SPEC_PATH,
    );
    expect(get(result, [ACCUMULATED_CONTEXT, "tlcResult"])).toBe(TLC_RESULT);
  });

  it("PHASE_5 state with tlaReviewPath parses", () => {
    const result = parseState({
      ...BASE_FIELDS,
      accumulatedContext: {
        briefingPath: BRIEFING_PATH,
        designConsensusPath: DESIGN_CONSENSUS_PATH,
        experts: ["Alice"],
        tlaReviewPath: TLA_REVIEW_PATH,
        tlaSpecPath: TLA_SPEC_PATH,
        tlcResult: TLC_RESULT,
      },
      phase: "PHASE_5_IMPLEMENTATION",
    });

    expect(result.phase).toBe("PHASE_5_IMPLEMENTATION");
    expect(get(result, [ACCUMULATED_CONTEXT, "tlaReviewPath"])).toBe(
      TLA_REVIEW_PATH,
    );
  });
});

describe("PipelineStateSchema — terminal phases", () => {
  it("PHASE_6 parses with full context", () => {
    const result = parseState({
      ...BASE_FIELDS,
      accumulatedContext: FULL_CONTEXT,
      phase: "PHASE_6_PAIR_PROGRAMMING",
    });

    expect(result.phase).toBe("PHASE_6_PAIR_PROGRAMMING");
    expect(get(result, [ACCUMULATED_CONTEXT, "implementationPlanPath"])).toBe(
      IMPLEMENTATION_PLAN_PATH,
    );
  });

  it("COMPLETE parses with full context", () => {
    const result = parseState({
      ...BASE_FIELDS,
      accumulatedContext: FULL_CONTEXT,
      phase: "COMPLETE",
    });

    expect(result.phase).toBe("COMPLETE");
  });

  it("HALTED state with haltReason USER_HALT parses", () => {
    const result = parseState({
      ...BASE_FIELDS,
      accumulatedContext: { briefingPath: BRIEFING_PATH },
      haltReason: "USER_HALT",
      phase: "HALTED",
    });

    expect(result.phase).toBe("HALTED");
    expect(result.haltReason).toBe("USER_HALT");
  });

  it("HALTED state with haltReason NONE fails", () => {
    expect(() => {
      parseState({
        ...BASE_FIELDS,
        accumulatedContext: {},
        haltReason: "NONE",
        phase: "HALTED",
      });
    }).toThrow(ZodError);
  });
});

describe("PipelineStateSchema — cross-cutting refinements", () => {
  it("non-HALTED state with haltReason != NONE fails", () => {
    expect(() => {
      parseState({
        ...BASE_FIELDS,
        accumulatedContext: {},
        haltReason: "USER_HALT",
        phase: "IDLE",
      });
    }).toThrow(ZodError);
  });

  it("retries value exceeding MAX_PIPELINE_RETRIES fails", () => {
    expect(() => {
      parseState({
        ...BASE_FIELDS,
        accumulatedContext: {},
        phase: "IDLE",
        retries: { PHASE_1_QUESTIONER: MAX_PIPELINE_RETRIES + 1 },
      });
    }).toThrow(ZodError);
  });

  it("validationAttempts exceeding MAX_VALIDATION_ATTEMPTS fails", () => {
    expect(() => {
      parseState({
        ...BASE_FIELDS,
        accumulatedContext: {},
        phase: "IDLE",
        validationAttempts: MAX_VALIDATION_ATTEMPTS + 1,
      });
    }).toThrow(ZodError);
  });
});
