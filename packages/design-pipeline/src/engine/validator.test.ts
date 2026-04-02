import filter from "lodash/filter.js";
import some from "lodash/some.js";
import startsWith from "lodash/startsWith.js";
import { describe, expect, it } from "vitest";

import type { PipelineState } from "../state-machine/pipeline-state.js";

import { ValidationResultSchema } from "../contracts/shared/validation-result.js";
import {
  validateCodeWriterOutput,
  validateDebateOutput,
  validateTestWriterOutput,
  validateTlaWriterOutput,
} from "./validator.js";

const STRUCTURAL_INVALID_FIELD = "STRUCTURAL_INVALID_FIELD";
const HEURISTIC_MISSING_EXPERT = "HEURISTIC_MISSING_EXPERT";
const HEURISTIC_TLA_INCOMPLETE = "HEURISTIC_TLA_INCOMPLETE";
const HEURISTIC_WRONG_EXTENSION = "HEURISTIC_WRONG_EXTENSION";
const HEURISTIC_PREFIX = "HEURISTIC_";
const EXPERT_TDD = "expert-tdd";
const EXPERT_DDD = "expert-ddd";
const BRIEFING_PATH = "/path/to/briefing.md";
const CONSENSUS_PATH = "/path/to/consensus.md";
const TLA_SPEC_PATH = "/path/to/spec.tla";
const TLA_CFG_PATH = "/path/to/spec.cfg";
const TYPESCRIPT_WRITER = "typescript-writer";
const VITEST_WRITER = "vitest-writer";
const UNKNOWN_WRITER = "unknown-writer";
const RETRIES = { PHASE_1_QUESTIONER: 0, PHASE_3_TLA_WRITER: 0 };

const makePhase2State = (): PipelineState => {
  return {
    accumulatedContext: {
      briefingPath: BRIEFING_PATH,
      experts: [EXPERT_TDD, EXPERT_DDD],
    },
    haltReason: "NONE",
    phase: "PHASE_2_DESIGN_DEBATE",
    retries: RETRIES,
    slug: "test",
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  };
};

const makePhase3State = (): PipelineState => {
  return {
    accumulatedContext: {
      briefingPath: BRIEFING_PATH,
      designConsensusPath: CONSENSUS_PATH,
      experts: [EXPERT_TDD, EXPERT_DDD],
    },
    haltReason: "NONE",
    phase: "PHASE_3_TLA_WRITER",
    retries: RETRIES,
    slug: "test",
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  };
};

const makePhase5State = (): PipelineState => {
  return {
    accumulatedContext: {
      briefingPath: BRIEFING_PATH,
      designConsensusPath: CONSENSUS_PATH,
      experts: [EXPERT_TDD, EXPERT_DDD],
      tlaReviewPath: "/path/to/review.md",
      tlaSpecPath: TLA_SPEC_PATH,
      tlcResult: "PASS",
    },
    haltReason: "NONE",
    phase: "PHASE_5_IMPLEMENTATION",
    retries: RETRIES,
    slug: "test",
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  };
};

const makeIdleState = (): PipelineState => {
  return {
    accumulatedContext: {},
    haltReason: "NONE",
    phase: "IDLE",
    retries: RETRIES,
    slug: "test",
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  };
};

const makeValidDebateOutput = () => {
  return {
    consensusReached: true,
    participatingExperts: [EXPERT_TDD, EXPERT_DDD],
    rounds: 3,
    synthesis: "The team agreed on TDD-first approach with DDD boundaries.",
    unresolvedDissents: [],
  };
};

const makeValidTlaOutput = () => {
  return {
    cfgPath: TLA_CFG_PATH,
    specContent:
      "MODULE Spec\nVARIABLES state\nInit == state = 0\nNext == state' = state + 1\n[]TypeInvariant",
    specPath: TLA_SPEC_PATH,
    tlcOutput: "Model checking completed. No errors.",
    tlcResult: "PASS",
  };
};

const makeValidCodeWriterOutput = (files: string[]) => {
  return {
    filesWritten: files,
    tddCycles: 3,
    testsPass: true,
  };
};

const makeValidTestWriterOutput = (files: string[]) => {
  return {
    allPass: true,
    testCount: 5,
    testFilesWritten: files,
  };
};

describe("structural pass", () => {
  it("debate output missing required field returns STRUCTURAL error", () => {
    const output = { consensusReached: true };
    const result = validateDebateOutput(output, makePhase2State());

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]?.code).toBe(STRUCTURAL_INVALID_FIELD);
  });

  it("TLA writer output with wrong type for tlcResult returns STRUCTURAL error", () => {
    const output = {
      cfgPath: TLA_CFG_PATH,
      specContent: "some content",
      specPath: TLA_SPEC_PATH,
      tlcOutput: "output",
      tlcResult: 42,
    };
    const result = validateTlaWriterOutput(output, makePhase3State());

    expect(result.valid).toBe(false);
    expect(
      some(result.errors, (error) => error.code === STRUCTURAL_INVALID_FIELD),
    ).toBe(true);
  });

  it("structural failure short-circuits — no heuristic errors in result", () => {
    const output = { consensusReached: true };
    const state = makePhase2State();
    const result = validateDebateOutput(output, state);

    expect(result.valid).toBe(false);

    const heuristicErrors = filter(result.errors, (error) => {
      return startsWith(error.code, HEURISTIC_PREFIX);
    });

    expect(heuristicErrors).toHaveLength(0);
  });

  it("code writer output missing required field returns STRUCTURAL error", () => {
    const output = { filesWritten: "not-an-array" };
    const result = validateCodeWriterOutput(
      output,
      makePhase5State(),
      TYPESCRIPT_WRITER,
    );

    expect(result.valid).toBe(false);
    expect(
      some(result.errors, (error) => error.code === STRUCTURAL_INVALID_FIELD),
    ).toBe(true);
  });

  it("test writer output missing required field returns STRUCTURAL error", () => {
    const output = { testFilesWritten: 42 };
    const result = validateTestWriterOutput(
      output,
      makePhase5State(),
      VITEST_WRITER,
    );

    expect(result.valid).toBe(false);
    expect(
      some(result.errors, (error) => error.code === STRUCTURAL_INVALID_FIELD),
    ).toBe(true);
  });
});

describe("debate heuristics", () => {
  it("returns HEURISTIC_MISSING_EXPERT when not all experts participate", () => {
    const output = {
      ...makeValidDebateOutput(),
      participatingExperts: [EXPERT_TDD],
    };
    const state = makePhase2State();
    const result = validateDebateOutput(output, state);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe(HEURISTIC_MISSING_EXPERT);
    expect(result.errors[0]?.hint).toContain(EXPERT_DDD);
  });

  it("returns valid when all experts are present", () => {
    const output = makeValidDebateOutput();
    const state = makePhase2State();
    const result = validateDebateOutput(output, state);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns valid when state has no experts array (IDLE phase)", () => {
    const output = makeValidDebateOutput();
    const state = makeIdleState();
    const result = validateDebateOutput(output, state);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("TLA+ heuristics", () => {
  it("returns valid for TLA+ style spec with VARIABLES, Init, Next, and []", () => {
    const output = makeValidTlaOutput();
    const result = validateTlaWriterOutput(output, makePhase3State());

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns valid for PlusCal style spec", () => {
    const output = {
      ...makeValidTlaOutput(),
      specContent:
        "variables x = 0;\nbegin\nalgorithm Foo\nprocess Worker\nBEGIN TRANSLATION",
    };
    const result = validateTlaWriterOutput(output, makePhase3State());

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns HEURISTIC_TLA_INCOMPLETE for spec missing required keywords", () => {
    const output = {
      ...makeValidTlaOutput(),
      specContent: "This is not a valid TLA+ spec at all.",
    };
    const result = validateTlaWriterOutput(output, makePhase3State());

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe(HEURISTIC_TLA_INCOMPLETE);
  });
});

describe("code writer heuristics", () => {
  it("typescript-writer with .tsx file returns HEURISTIC_WRONG_EXTENSION", () => {
    const output = makeValidCodeWriterOutput(["foo.tsx"]);
    const result = validateCodeWriterOutput(
      output,
      makePhase5State(),
      TYPESCRIPT_WRITER,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe(HEURISTIC_WRONG_EXTENSION);
  });

  it("typescript-writer with .ts file returns valid", () => {
    const output = makeValidCodeWriterOutput(["foo.ts"]);
    const result = validateCodeWriterOutput(
      output,
      makePhase5State(),
      TYPESCRIPT_WRITER,
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("ui-writer with .tsx file returns valid", () => {
    const output = makeValidCodeWriterOutput(["component.tsx"]);
    const result = validateCodeWriterOutput(
      output,
      makePhase5State(),
      "ui-writer",
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("unknown writerType skips extension check and returns valid", () => {
    const output = makeValidCodeWriterOutput(["anything.xyz"]);
    const result = validateCodeWriterOutput(
      output,
      makePhase5State(),
      UNKNOWN_WRITER,
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("test writer heuristics", () => {
  it("vitest-writer with .spec.ts file returns HEURISTIC_WRONG_EXTENSION", () => {
    const output = makeValidTestWriterOutput(["foo.spec.ts"]);
    const result = validateTestWriterOutput(
      output,
      makePhase5State(),
      VITEST_WRITER,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe(HEURISTIC_WRONG_EXTENSION);
  });

  it("vitest-writer with .test.ts file returns valid", () => {
    const output = makeValidTestWriterOutput(["foo.test.ts"]);
    const result = validateTestWriterOutput(
      output,
      makePhase5State(),
      VITEST_WRITER,
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("unknown writerType skips extension check and returns valid", () => {
    const output = makeValidTestWriterOutput(["anything.xyz"]);
    const result = validateTestWriterOutput(
      output,
      makePhase5State(),
      UNKNOWN_WRITER,
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("ValidationResult shape", () => {
  it("valid result conforms to ValidationResultSchema", () => {
    const output = makeValidDebateOutput();
    const result = validateDebateOutput(output, makePhase2State());

    expect(result.valid).toBe(true);

    const parsed = ValidationResultSchema.safeParse(result);

    expect(parsed.success).toBe(true);
  });

  it("error result conforms to ValidationResultSchema", () => {
    const output = { consensusReached: true };
    const result = validateDebateOutput(output, makePhase2State());

    expect(result.valid).toBe(false);

    const parsed = ValidationResultSchema.safeParse(result);

    expect(parsed.success).toBe(true);
  });
});
