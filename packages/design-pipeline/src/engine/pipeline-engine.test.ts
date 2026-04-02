import map from "lodash/map.js";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PipelineState } from "../state-machine/pipeline-state.js";

import {
  type HaltReason,
  MAX_PIPELINE_RETRIES,
} from "../state-machine/pipeline-phases.js";
import {
  advancePipeline,
  advancePipelineWithOutput,
  getPipelineStatus,
  haltPipeline,
  type PipelineResponse,
  retryPipeline,
  startPipeline,
} from "./pipeline-engine.js";

const TEST_SLUG = "engine-test";
const STRUCTURAL_INVALID_INPUT = "STRUCTURAL_INVALID_INPUT";
const HEURISTIC_MISSING_EXPERT = "HEURISTIC_MISSING_EXPERT";
const PIPELINE_LOCKED = "PIPELINE_LOCKED";
const PHASE_1 = "PHASE_1_QUESTIONER";
const PHASE_2 = "PHASE_2_DESIGN_DEBATE";
const PHASE_3 = "PHASE_3_TLA_WRITER";
const BRIEFING_PATH = "/fixtures/briefing.md";
const EXPERT_A = "expert-a";
const EXPERT_B = "expert-b";
const PHASE_1_OUTPUT_FILE = "phase1-output.json";
const STATE_LOCK = "state.lock";
const HALTED = "HALTED";
const NO_SESSION_ERROR = "returns error when no session exists";

const extractCodes = (result: PipelineResponse): string[] => {
  if ("errors" in result) {
    return map(result.errors, "code");
  }

  return [];
};

const writeStateDirectly = async (
  directory: string,
  state: PipelineState,
): Promise<void> => {
  const statePath = path.join(directory, "state.json");
  const lockPath = path.join(directory, STATE_LOCK);
  await writeFile(statePath, JSON.stringify(state, null, 2), "utf8");
  await writeFile(lockPath, String(process.pid), "utf8");
};

const CONSENSUS_PATH = "/fixtures/consensus.md";
const TLA_SPEC_PATH = "/fixtures/spec.tla";
const TLC_RESULT_PASS = "PASS";

const makeRetries = (
  overrides?: Partial<Pick<PipelineState, "retries">>,
): { PHASE_1_QUESTIONER: number; PHASE_3_TLA_WRITER: number } => {
  return {
    PHASE_1_QUESTIONER: overrides?.retries?.PHASE_1_QUESTIONER ?? 0,
    PHASE_3_TLA_WRITER: overrides?.retries?.PHASE_3_TLA_WRITER ?? 0,
  };
};

const makePhase4State = (
  overrides?: Partial<Pick<PipelineState, "retries">>,
): PipelineState => {
  return {
    accumulatedContext: {
      briefingPath: BRIEFING_PATH,
      designConsensusPath: CONSENSUS_PATH,
      experts: [EXPERT_A, EXPERT_B],
      tlaSpecPath: TLA_SPEC_PATH,
      tlcResult: TLC_RESULT_PASS,
    },
    haltReason: "NONE" as const,
    phase: "PHASE_4_TLA_REVIEW" as const,
    retries: makeRetries(overrides),
    slug: TEST_SLUG,
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  };
};

const makePhase3State = (
  overrides?: Partial<Pick<PipelineState, "retries">>,
): PipelineState => {
  return {
    accumulatedContext: {
      briefingPath: BRIEFING_PATH,
      designConsensusPath: CONSENSUS_PATH,
      experts: [EXPERT_A, EXPERT_B],
    },
    haltReason: "NONE" as const,
    phase: "PHASE_3_TLA_WRITER" as const,
    retries: makeRetries(overrides),
    slug: TEST_SLUG,
    startedAt: new Date().toISOString(),
    validationAttempts: 0,
  };
};

const writePhase1Output = async (
  directory: string,
  fileName: string,
): Promise<string> => {
  const outputPath = path.join(directory, fileName);
  await writeFile(
    outputPath,
    JSON.stringify({
      briefingPath: BRIEFING_PATH,
      experts: [EXPERT_A, EXPERT_B],
    }),
    "utf8",
  );
  return outputPath;
};

let testDirectory: string;

beforeEach(async () => {
  testDirectory = await mkdtemp(path.join(tmpdir(), "pipeline-engine-"));
});

afterEach(async () => {
  await rm(testDirectory, { force: true, recursive: true });
});

describe("startPipeline", () => {
  it("creates state file with PHASE_1, returns phase context", async () => {
    const result = await startPipeline(TEST_SLUG, testDirectory);

    expect(result).toStrictEqual({
      context: {},
      phase: PHASE_1,
    });

    const status = await getPipelineStatus(TEST_SLUG, testDirectory);
    expect(status).toHaveProperty("phase", PHASE_1);
  });

  it("returns PIPELINE_LOCKED error when lock exists", async () => {
    await startPipeline(TEST_SLUG, testDirectory);

    const result = await startPipeline(TEST_SLUG, testDirectory);

    expect(result).toHaveProperty("error", PIPELINE_LOCKED);
    expect(result).toHaveProperty("pid");
  });
});

describe("advancePipeline", () => {
  it("transitions to PHASE_2 with valid questioner output", async () => {
    await startPipeline(TEST_SLUG, testDirectory);

    const outputPath = await writePhase1Output(
      testDirectory,
      PHASE_1_OUTPUT_FILE,
    );

    const result = await advancePipeline(TEST_SLUG, outputPath, testDirectory);

    expect(result).toStrictEqual({
      context: {
        briefingPath: BRIEFING_PATH,
        experts: [EXPERT_A, EXPERT_B],
      },
      phase: PHASE_2,
    });

    const status = await getPipelineStatus(TEST_SLUG, testDirectory);
    expect(status).toHaveProperty("phase", PHASE_2);
  });

  it("returns errors for invalid debate output (missing synthesis)", async () => {
    await startPipeline(TEST_SLUG, testDirectory);

    const phase1Output = await writePhase1Output(
      testDirectory,
      PHASE_1_OUTPUT_FILE,
    );
    await advancePipeline(TEST_SLUG, phase1Output, testDirectory);

    const phase2Output = path.join(testDirectory, "phase2-output.json");
    await writeFile(
      phase2Output,
      JSON.stringify({
        consensusReached: true,
        participatingExperts: [EXPERT_A, EXPERT_B],
        rounds: 3,
        unresolvedDissents: [],
      }),
      "utf8",
    );

    const result = await advancePipeline(
      TEST_SLUG,
      phase2Output,
      testDirectory,
    );

    expect(result).toHaveProperty("valid", false);
    expect(result).toHaveProperty("errors");
    if ("errors" in result) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("returns HEURISTIC_MISSING_EXPERT for debate output missing an expert", async () => {
    await startPipeline(TEST_SLUG, testDirectory);

    const phase1Output = await writePhase1Output(
      testDirectory,
      PHASE_1_OUTPUT_FILE,
    );
    await advancePipeline(TEST_SLUG, phase1Output, testDirectory);

    const phase2Output = path.join(testDirectory, "phase2-missing.json");
    await writeFile(
      phase2Output,
      JSON.stringify({
        consensusReached: true,
        participatingExperts: [EXPERT_A],
        rounds: 2,
        synthesis: "Design consensus reached.",
        unresolvedDissents: [],
      }),
      "utf8",
    );

    const result = await advancePipeline(
      TEST_SLUG,
      phase2Output,
      testDirectory,
    );

    expect(result).toHaveProperty("valid", false);
    expect(extractCodes(result)).toContain(HEURISTIC_MISSING_EXPERT);
  });

  it("returns STRUCTURAL_INVALID_INPUT for missing output file", async () => {
    await startPipeline(TEST_SLUG, testDirectory);

    const missingPath = path.join(testDirectory, "nonexistent.json");
    const result = await advancePipeline(TEST_SLUG, missingPath, testDirectory);

    expect(result).toHaveProperty("valid", false);
    expect(extractCodes(result)).toContain(STRUCTURAL_INVALID_INPUT);
  });

  it("returns STRUCTURAL_INVALID_INPUT for invalid JSON file", async () => {
    await startPipeline(TEST_SLUG, testDirectory);

    const badJsonPath = path.join(testDirectory, "bad.json");
    await writeFile(badJsonPath, "not valid json {{{", "utf8");

    const result = await advancePipeline(TEST_SLUG, badJsonPath, testDirectory);

    expect(result).toHaveProperty("valid", false);
    expect(extractCodes(result)).toContain(STRUCTURAL_INVALID_INPUT);
  });

  it("returns STRUCTURAL_INVALID_INPUT for JSON array output", async () => {
    await startPipeline(TEST_SLUG, testDirectory);

    const arrayPath = path.join(testDirectory, "array.json");
    await writeFile(arrayPath, "[1, 2, 3]", "utf8");

    const result = await advancePipeline(TEST_SLUG, arrayPath, testDirectory);

    expect(result).toHaveProperty("valid", false);
    expect(extractCodes(result)).toContain(STRUCTURAL_INVALID_INPUT);
  });

  it("returns error when questioner output has non-string experts", async () => {
    await startPipeline(TEST_SLUG, testDirectory);

    const outputPath = path.join(testDirectory, "bad-experts.json");
    await writeFile(
      outputPath,
      JSON.stringify({
        briefingPath: BRIEFING_PATH,
        experts: [1, 2, 3],
      }),
      "utf8",
    );

    const result = await advancePipeline(TEST_SLUG, outputPath, testDirectory);

    expect(result).toHaveProperty("error");
  });

  it(NO_SESSION_ERROR, async () => {
    const fakePath = path.join(testDirectory, "output.json");
    await writeFile(fakePath, "{}", "utf8");

    const result = await advancePipeline(TEST_SLUG, fakePath, testDirectory);

    expect(result).toHaveProperty("error");
  });
});

describe("advancePipelineWithOutput", () => {
  it("transitions to PHASE_2 with valid questioner output object", async () => {
    await startPipeline(TEST_SLUG, testDirectory);

    const result = await advancePipelineWithOutput(
      TEST_SLUG,
      { briefingPath: BRIEFING_PATH, experts: [EXPERT_A, EXPERT_B] },
      testDirectory,
    );

    expect(result).toStrictEqual({
      context: {
        briefingPath: BRIEFING_PATH,
        experts: [EXPERT_A, EXPERT_B],
      },
      phase: PHASE_2,
    });

    const status = await getPipelineStatus(TEST_SLUG, testDirectory);
    expect(status).toHaveProperty("phase", PHASE_2);
  });

  it("returns validation errors for invalid debate output object", async () => {
    await startPipeline(TEST_SLUG, testDirectory);
    await advancePipelineWithOutput(
      TEST_SLUG,
      { briefingPath: BRIEFING_PATH, experts: [EXPERT_A, EXPERT_B] },
      testDirectory,
    );

    const result = await advancePipelineWithOutput(
      TEST_SLUG,
      {
        consensusReached: true,
        participatingExperts: [EXPERT_A, EXPERT_B],
        rounds: 3,
        unresolvedDissents: [],
      },
      testDirectory,
    );

    expect(result).toHaveProperty("valid", false);
    expect(result).toHaveProperty("errors");
  });

  it(NO_SESSION_ERROR, async () => {
    const result = await advancePipelineWithOutput(
      "no-session-slug",
      { briefingPath: BRIEFING_PATH, experts: [EXPERT_A] },
      testDirectory,
    );

    expect(result).toHaveProperty("error");
  });
});

describe("getPipelineStatus", () => {
  it("returns current state", async () => {
    await startPipeline(TEST_SLUG, testDirectory);

    const status = await getPipelineStatus(TEST_SLUG, testDirectory);

    expect(status).toHaveProperty("phase", PHASE_1);
    expect(status).toHaveProperty("slug", TEST_SLUG);
  });
});

describe("full forward pipeline", () => {
  it("advances through all 6 phases to COMPLETE", async () => {
    await startPipeline(TEST_SLUG, testDirectory);

    const experts = ["architect", "security-expert"];

    // Phase 1 -> Phase 2: questioner output
    const phase1Path = path.join(testDirectory, "p1.json");
    await writeFile(
      phase1Path,
      JSON.stringify({
        briefingPath: BRIEFING_PATH,
        experts,
      }),
      "utf8",
    );
    const r1 = await advancePipeline(TEST_SLUG, phase1Path, testDirectory);
    expect(r1).toHaveProperty("phase", PHASE_2);

    // Phase 2 -> Phase 3: debate output
    const phase2Path = path.join(testDirectory, "p2.json");
    await writeFile(
      phase2Path,
      JSON.stringify({
        consensusReached: true,
        participatingExperts: experts,
        rounds: 3,
        synthesis: "Design consensus on architecture approach.",
        unresolvedDissents: [],
      }),
      "utf8",
    );
    const r2 = await advancePipeline(TEST_SLUG, phase2Path, testDirectory);
    expect(r2).toHaveProperty("phase", "PHASE_3_TLA_WRITER");

    // Phase 3 -> Phase 4: TLA writer output
    const phase3Path = path.join(testDirectory, "p3.json");
    const tlaContent = [
      "VARIABLES state, phase",
      'Init == state = "idle"',
      'Next == state\' = "running"',
      "INVARIANT TypeOK",
      String.raw`[] (state \in {"idle", "running"})`,
    ].join("\n");
    await writeFile(
      phase3Path,
      JSON.stringify({
        cfgPath: "/fixtures/spec.cfg",
        specContent: tlaContent,
        specPath: "/fixtures/spec.tla",
        tlcOutput: "Model checking complete. No error.",
        tlcResult: "PASS",
      }),
      "utf8",
    );
    const r3 = await advancePipeline(TEST_SLUG, phase3Path, testDirectory);
    expect(r3).toHaveProperty("phase", "PHASE_4_TLA_REVIEW");

    // Phase 4 -> Phase 5: TLA review debate output
    const phase4Path = path.join(testDirectory, "p4.json");
    await writeFile(
      phase4Path,
      JSON.stringify({
        consensusReached: true,
        participatingExperts: experts,
        rounds: 2,
        synthesis: "TLA+ specification reviewed and approved.",
        unresolvedDissents: [],
      }),
      "utf8",
    );
    const r4 = await advancePipeline(TEST_SLUG, phase4Path, testDirectory);
    expect(r4).toHaveProperty("phase", "PHASE_5_IMPLEMENTATION");

    // Phase 5 -> Phase 6: implementation output
    const phase5Path = path.join(testDirectory, "p5.json");
    await writeFile(
      phase5Path,
      JSON.stringify({
        implementationPlanPath: "/fixtures/impl-plan.md",
      }),
      "utf8",
    );
    const r5 = await advancePipeline(TEST_SLUG, phase5Path, testDirectory);
    expect(r5).toHaveProperty("phase", "PHASE_6_PAIR_PROGRAMMING");

    // Phase 6 -> COMPLETE: pair programming output
    const phase6Path = path.join(testDirectory, "p6.json");
    await writeFile(
      phase6Path,
      JSON.stringify({
        completed: true,
      }),
      "utf8",
    );
    const r6 = await advancePipeline(TEST_SLUG, phase6Path, testDirectory);
    expect(r6).toHaveProperty("phase", "COMPLETE");

    // Verify final state
    const finalStatus = await getPipelineStatus(TEST_SLUG, testDirectory);
    expect(finalStatus).toHaveProperty("phase", "COMPLETE");
  });
});

describe("retryPipeline", () => {
  it("retries from PHASE_4 to PHASE_3: clears tlaSpecPath/tlcResult/tlaReviewPath, state is PHASE_3", async () => {
    await writeStateDirectly(testDirectory, makePhase4State());

    const result = await retryPipeline(TEST_SLUG, PHASE_3, testDirectory);

    expect(result).toHaveProperty("phase", PHASE_3);

    if ("context" in result) {
      expect(result.context).not.toHaveProperty("tlaSpecPath");
      expect(result.context).not.toHaveProperty("tlcResult");
      expect(result.context).not.toHaveProperty("tlaReviewPath");
      expect(result.context).toHaveProperty("briefingPath", BRIEFING_PATH);
      expect(result.context).toHaveProperty("designConsensusPath");
    }

    const status = await getPipelineStatus(TEST_SLUG, testDirectory);
    expect(status).toHaveProperty("phase", PHASE_3);
  });

  it("retries from PHASE_4 to PHASE_1: clears all context, state is PHASE_1", async () => {
    await writeStateDirectly(testDirectory, makePhase4State());

    const result = await retryPipeline(TEST_SLUG, PHASE_1, testDirectory);

    expect(result).toHaveProperty("phase", PHASE_1);

    if ("context" in result) {
      expect(result.context).not.toHaveProperty("briefingPath");
      expect(result.context).not.toHaveProperty("designConsensusPath");
      expect(result.context).not.toHaveProperty("tlaSpecPath");
      expect(result.context).not.toHaveProperty("tlcResult");
      expect(result.context).not.toHaveProperty("experts");
    }

    const status = await getPipelineStatus(TEST_SLUG, testDirectory);
    expect(status).toHaveProperty("phase", PHASE_1);
  });

  it("retries from PHASE_3 to PHASE_1: clears all context", async () => {
    await writeStateDirectly(testDirectory, makePhase3State());

    const result = await retryPipeline(TEST_SLUG, PHASE_1, testDirectory);

    expect(result).toHaveProperty("phase", PHASE_1);

    if ("context" in result) {
      expect(result.context).not.toHaveProperty("briefingPath");
      expect(result.context).not.toHaveProperty("designConsensusPath");
      expect(result.context).not.toHaveProperty("experts");
    }
  });

  it(NO_SESSION_ERROR, async () => {
    const emptyDirectory = await mkdtemp(
      path.join(tmpdir(), "pipeline-retry-empty-"),
    );

    try {
      const result = await retryPipeline(TEST_SLUG, PHASE_1, emptyDirectory);
      expect(result).toHaveProperty("error");
    } finally {
      await rm(emptyDirectory, { force: true, recursive: true });
    }
  });

  it("returns error when retries at max", async () => {
    const state = makePhase4State({
      retries: {
        PHASE_1_QUESTIONER: MAX_PIPELINE_RETRIES,
        PHASE_3_TLA_WRITER: MAX_PIPELINE_RETRIES,
      },
    });
    await writeStateDirectly(testDirectory, state);

    const result = await retryPipeline(TEST_SLUG, PHASE_3, testDirectory);

    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toContain("Retry budget exhausted");
    }
  });
});

describe("haltPipeline", () => {
  it(NO_SESSION_ERROR, async () => {
    const emptyDirectory = await mkdtemp(
      path.join(tmpdir(), "pipeline-halt-empty-"),
    );

    try {
      const result = await haltPipeline(
        TEST_SLUG,
        "USER_HALT" as HaltReason,
        emptyDirectory,
      );
      expect(result).toHaveProperty("error");
    } finally {
      await rm(emptyDirectory, { force: true, recursive: true });
    }
  });

  it("halts with USER_HALT: state becomes HALTED, lock file removed", async () => {
    await writeStateDirectly(testDirectory, makePhase4State());

    const result = await haltPipeline(
      TEST_SLUG,
      "USER_HALT" as HaltReason,
      testDirectory,
    );

    expect(result).toHaveProperty("phase", HALTED);
    if ("context" in result) {
      expect(result.context).toHaveProperty("haltReason", "USER_HALT");
    }

    // Lock file should be removed for terminal states
    await expect(
      access(path.join(testDirectory, STATE_LOCK)),
    ).rejects.toThrow();
  });

  it("halts with AGENT_FAILURE: state becomes HALTED", async () => {
    await writeStateDirectly(testDirectory, makePhase3State());

    const result = await haltPipeline(
      TEST_SLUG,
      "AGENT_FAILURE" as HaltReason,
      testDirectory,
    );

    expect(result).toHaveProperty("phase", HALTED);
    if ("context" in result) {
      expect(result.context).toHaveProperty("haltReason", "AGENT_FAILURE");
    }
  });

  it("halts with RETRY_EXHAUSTED succeeds when retry counter at max", async () => {
    const state = makePhase4State({
      retries: {
        PHASE_1_QUESTIONER: 0,
        PHASE_3_TLA_WRITER: MAX_PIPELINE_RETRIES,
      },
    });
    await writeStateDirectly(testDirectory, state);

    const result = await haltPipeline(
      TEST_SLUG,
      "RETRY_EXHAUSTED" as HaltReason,
      testDirectory,
    );

    expect(result).toHaveProperty("phase", HALTED);
    if ("context" in result) {
      expect(result.context).toHaveProperty("haltReason", "RETRY_EXHAUSTED");
    }
  });

  it("halts with RETRY_EXHAUSTED fails when no counter at max", async () => {
    await writeStateDirectly(testDirectory, makePhase4State());

    const result = await haltPipeline(
      TEST_SLUG,
      "RETRY_EXHAUSTED" as HaltReason,
      testDirectory,
    );

    expect(result).toHaveProperty("error");
  });

  it("after halt, advancePipeline returns error (terminal state)", async () => {
    await writeStateDirectly(testDirectory, makePhase4State());
    await haltPipeline(TEST_SLUG, "USER_HALT" as HaltReason, testDirectory);

    // Need to recreate the lock since halt removes it, but advancePipeline
    // just loads state (which is HALTED) - the transition will fail
    const fakePath = path.join(testDirectory, "fake-output.json");
    await writeFile(fakePath, JSON.stringify({ done: true }), "utf8");

    const result = await advancePipeline(TEST_SLUG, fakePath, testDirectory);

    expect(result).toHaveProperty("error");
    if ("error" in result) {
      expect(result.error).toContain("terminal");
    }
  });
});

describe("retry exhaustion scenario", () => {
  it("retries 3 times (MAX_PIPELINE_RETRIES), fourth retry blocked, halt with RETRY_EXHAUSTED succeeds", async () => {
    // Start at PHASE_4 with 0 retries
    await writeStateDirectly(testDirectory, makePhase4State());

    // Retry 1: PHASE_4 -> PHASE_3
    const r1 = await retryPipeline(TEST_SLUG, PHASE_3, testDirectory);
    expect(r1).toHaveProperty("phase", PHASE_3);

    // We need to advance back to PHASE_4 to retry again
    // Write state directly at PHASE_4 with 1 retry used
    const state2 = makePhase4State({
      retries: { PHASE_1_QUESTIONER: 0, PHASE_3_TLA_WRITER: 1 },
    });
    await writeStateDirectly(testDirectory, state2);

    // Retry 2
    const r2 = await retryPipeline(TEST_SLUG, PHASE_3, testDirectory);
    expect(r2).toHaveProperty("phase", PHASE_3);

    // Write state at PHASE_4 with 2 retries used
    const state3 = makePhase4State({
      retries: { PHASE_1_QUESTIONER: 0, PHASE_3_TLA_WRITER: 2 },
    });
    await writeStateDirectly(testDirectory, state3);

    // Retry 3
    const r3 = await retryPipeline(TEST_SLUG, PHASE_3, testDirectory);
    expect(r3).toHaveProperty("phase", PHASE_3);

    // Write state at PHASE_4 with 3 retries used (MAX)
    const state4 = makePhase4State({
      retries: {
        PHASE_1_QUESTIONER: 0,
        PHASE_3_TLA_WRITER: MAX_PIPELINE_RETRIES,
      },
    });
    await writeStateDirectly(testDirectory, state4);

    // Retry 4: blocked
    const r4 = await retryPipeline(TEST_SLUG, PHASE_3, testDirectory);
    expect(r4).toHaveProperty("error");

    // Halt with RETRY_EXHAUSTED should succeed now
    const haltResult = await haltPipeline(
      TEST_SLUG,
      "RETRY_EXHAUSTED" as HaltReason,
      testDirectory,
    );
    expect(haltResult).toHaveProperty("phase", HALTED);
  });
});
