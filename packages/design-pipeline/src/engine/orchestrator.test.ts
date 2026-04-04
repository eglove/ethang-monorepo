import constant from "lodash/constant.js";
import { describe, expect, it, vi } from "vitest";

import type { ClaudeAdapter, ClaudeResult } from "../ports/claude-adapter.ts";
import type { GitAdapter } from "../ports/git-adapter.ts";
import type { SessionResult } from "../stages/questioner-session.ts";

import {
  createAllLegacyFlags,
  createDefaultFeatureFlags,
} from "../config/feature-flags.ts";
import { defaultPipelineConfig } from "../constants.ts";
import {
  executeOrchestrator,
  executeStage,
  getStageName,
  type QuestionerRunner,
} from "./orchestrator.ts";
import { PipelineStore } from "./pipeline-store.ts";

function makeClaudeAdapter(
  responseMap?: Record<number, ClaudeResult>,
): ClaudeAdapter {
  let callIndex = 0;
  const defaultResponse: ClaudeResult = { data: {}, ok: true };
  return {
    async executePrompt() {
      await Promise.resolve();
      const r = responseMap?.[callIndex] ?? defaultResponse;
      callIndex += 1;
      return r;
    },
    async routePairMessage() {
      await Promise.resolve();
      const r = responseMap?.[callIndex] ?? defaultResponse;
      callIndex += 1;
      return r;
    },
    async streamPrompt() {
      await Promise.resolve();
      const r = responseMap?.[callIndex] ?? defaultResponse;
      callIndex += 1;
      return r;
    },
  };
}

function makeFailedSessionResult(): SessionResult {
  return {
    artifact: {
      artifactState: "empty",
      questions: [],
      sessionState: "failed",
      summary: null,
      turnCount: 0,
    },
    briefingPath: null,
    error: "user_abandon",
    success: false,
  };
}

function makeFullClaudeAdapterStages2Through7(): ClaudeAdapter {
  // This adapter handles stages 2-7 only (questioner is handled by SDK runner).
  // Stage 2 (DebateModerator): execute
  // Stage 3 (TlaWriter): execute
  // Stage 4 (ExpertReview): execute
  // Stage 5 (ImplementationPlanning): streaming + execute
  // Stage 6 (PairProgramming): pair routing + execute
  // Stage 7 (ForkJoin): execute
  let callIndex = 0;
  const responses: ClaudeResult[] = [
    // Stage 2: execute
    {
      data: { consensus: "C", dissent: [], recommendations: ["r"] },
      ok: true,
    },
    // Stage 3: execute
    {
      data: { cfgContent: "C", tlaContent: "T", tlcOutput: "O" },
      ok: true,
    },
    // Stage 4: execute
    { data: { amendments: [], consensus: "R", gaps: [] }, ok: true },
    // Stage 5: streaming + execute
    { data: {}, ok: true },
    {
      data: {
        steps: [{ files: ["f.ts"], id: "T1", title: "S" }],
        tiers: [{ taskIds: ["T1"], tier: 1 }],
      },
      ok: true,
    },
    // Stage 6: pair routing + execute
    { data: {}, ok: true },
    {
      data: {
        branchName: "b",
        commitMessage: "m",
        completedTasks: ["T1"],
        testsPassed: true,
      },
      ok: true,
    },
    // Stage 7: execute
    {
      data: {
        branchName: "b2",
        commitMessage: "m2",
        plantUml: "P",
        reviewSummary: "R",
      },
      ok: true,
    },
  ];
  return {
    async executePrompt() {
      await Promise.resolve();
      const r = responses[callIndex] ?? { data: {}, ok: true as const };
      callIndex += 1;
      return r;
    },
    async routePairMessage() {
      await Promise.resolve();
      const r = responses[callIndex] ?? { data: {}, ok: true as const };
      callIndex += 1;
      return r;
    },
    async streamPrompt() {
      await Promise.resolve();
      const r = responses[callIndex] ?? { data: {}, ok: true as const };
      callIndex += 1;
      return r;
    },
  };
}

function makeGitAdapter(): GitAdapter {
  let lockOwner: string | undefined;
  return {
    acquireLock: (owner: string) => {
      if (lockOwner !== undefined && lockOwner !== owner) {
        return false;
      }
      lockOwner = owner;
      return true;
    },
    async checkout() {
      await Promise.resolve();
      return { ok: true };
    },
    async commit() {
      await Promise.resolve();
      return { ok: true };
    },
    async createBranch() {
      await Promise.resolve();
      return { ok: true };
    },
    getCurrentBranch: constant(Promise.resolve("main")),
    async push() {
      await Promise.resolve();
      return { ok: true };
    },
    releaseLock() {
      lockOwner = undefined;
    },
  };
}

function makeSuccessfulSessionResult(): SessionResult {
  return {
    artifact: {
      artifactState: "complete",
      questions: [{ answer: "constraint-1", question: "requirement-1" }],
      sessionState: "completed",
      summary: "Test summary",
      turnCount: 2,
    },
    briefingPath: "docs/questioner-sessions/2026-01-01_test.md",
    success: true,
  };
}

// eslint-disable-next-line @typescript-eslint/require-await
const successRunner: QuestionerRunner = async () =>
  makeSuccessfulSessionResult();

// eslint-disable-next-line @typescript-eslint/require-await
const failRunner: QuestionerRunner = async () => makeFailedSessionResult();

// eslint-disable-next-line @typescript-eslint/require-await
const throwingRunner: QuestionerRunner = async () => {
  throw new Error("unexpected SDK crash");
};

describe("Pipeline Orchestrator", () => {
  it("full happy-path run executes all 7 stages and completes", async () => {
    const claude = makeFullClaudeAdapterStages2Through7();
    const git = makeGitAdapter();
    const mockRunner = successRunner;
    const result = await executeOrchestrator(
      {
        claudeAdapter: claude,
        config: defaultPipelineConfig,
        gitAdapter: git,
        questionerRunner: mockRunner,
      },
      undefined,
      "run-1",
    );
    expect(result.success).toBe(true);
    expect(result.state.state).toBe("completed");
  });

  it("failure at stage 1 with checkpoint=0 fails without compensation", async () => {
    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();
    const mockRunner = failRunner;
    const result = await executeOrchestrator(
      {
        claudeAdapter: claude,
        config: defaultPipelineConfig,
        gitAdapter: git,
        questionerRunner: mockRunner,
      },
      undefined,
      "run-1",
    );
    expect(result.success).toBe(false);
    expect(result.state.state).toBe("failed");
  });

  it("missing questionerRunner fails stage 1", async () => {
    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();
    const result = await executeOrchestrator(
      { claudeAdapter: claude, config: defaultPipelineConfig, gitAdapter: git },
      undefined,
      "run-no-runner",
    );
    expect(result.success).toBe(false);
    expect(result.state.state).toBe("failed");
    expect(result.state.stages.Questioner.error).toBe(
      "questioner_runner_missing",
    );
  });

  it("pair routing failure triggers compensation when checkpoint > 0", async () => {
    let callIndex = 0;
    const failAtPairRouting: ClaudeAdapter = {
      async executePrompt() {
        await Promise.resolve();
        const r = callIndex;
        callIndex += 1;
        if (5 >= r) {
          return {
            data: {
              amendments: [],
              cfgContent: "C",
              consensus: "C",
              constraints: ["c"],
              dissent: [],
              gaps: [],
              recommendations: ["r"],
              requirements: ["r"],
              steps: [{ files: ["f.ts"], id: "T1", title: "S" }],
              summary: "S",
              tiers: [{ taskIds: ["T1"], tier: 1 }],
              tlaContent: "T",
              tlcOutput: "O",
            },
            ok: true,
          };
        }
        return { data: {}, ok: true };
      },
      async routePairMessage() {
        await Promise.resolve();
        return {
          errorKind: "claude_api_timeout",
          message: "timeout",
          ok: false,
        };
      },
      async streamPrompt() {
        await Promise.resolve();
        return { data: {}, ok: true };
      },
    };
    const git = makeGitAdapter();
    const mockRunner = successRunner;
    const result = await executeOrchestrator(
      {
        claudeAdapter: failAtPairRouting,
        config: defaultPipelineConfig,
        gitAdapter: git,
        questionerRunner: mockRunner,
      },
      undefined,
      "run-pair-fail",
    );
    expect(result.success).toBe(false);
  });
});

describe("Pipeline Orchestrator — SDK & feature flags", () => {
  it("creates a new store per invocation (instance-scoped)", async () => {
    const claude1 = makeFullClaudeAdapterStages2Through7();
    const claude2 = makeFullClaudeAdapterStages2Through7();
    const git = makeGitAdapter();
    const mockRunner = successRunner;
    const result1 = await executeOrchestrator(
      {
        claudeAdapter: claude1,
        config: defaultPipelineConfig,
        gitAdapter: git,
        questionerRunner: mockRunner,
      },
      undefined,
      "run-1",
    );
    const result2 = await executeOrchestrator(
      {
        claudeAdapter: claude2,
        config: defaultPipelineConfig,
        gitAdapter: git,
        questionerRunner: mockRunner,
      },
      undefined,
      "run-2",
    );
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.state).not.toBe(result2.state);
  });

  it("questioner uses SDK path when questionerRunner is provided", async () => {
    let runnerCalled = false;
    // eslint-disable-next-line @typescript-eslint/require-await
    const mockRunner: QuestionerRunner = async () => {
      runnerCalled = true;
      return makeSuccessfulSessionResult();
    };
    const claude = makeFullClaudeAdapterStages2Through7();
    const git = makeGitAdapter();
    const result = await executeOrchestrator(
      {
        claudeAdapter: claude,
        config: defaultPipelineConfig,
        gitAdapter: git,
        questionerRunner: mockRunner,
      },
      undefined,
      "run-sdk-questioner",
    );
    expect(runnerCalled).toBe(true);
    expect(result.success).toBe(true);
    expect(result.state.state).toBe("completed");
  });

  it("feature flags route stages 2-7 to legacy handoff when all SDK flags are off", async () => {
    let runnerCalled = false;
    // eslint-disable-next-line @typescript-eslint/require-await
    const mockRunner: QuestionerRunner = async () => {
      runnerCalled = true;
      return makeSuccessfulSessionResult();
    };
    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();
    const flags = createAllLegacyFlags();
    const result = await executeOrchestrator(
      {
        claudeAdapter: claude,
        config: defaultPipelineConfig,
        featureFlags: flags,
        gitAdapter: git,
        questionerRunner: mockRunner,
      },
      undefined,
      "run-legacy-handoff",
    );
    expect(runnerCalled).toBe(true);
    expect(result.success).toBe(true);
    // State should be "running" since stages 2-7 were not executed in-process
    expect(result.state.state).toBe("running");
  });

  it("failed questioner does not dispatch stages 2-7", async () => {
    const mockRunner = failRunner;
    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();
    const result = await executeOrchestrator(
      {
        claudeAdapter: claude,
        config: defaultPipelineConfig,
        gitAdapter: git,
        questionerRunner: mockRunner,
      },
      undefined,
      "run-questioner-fail",
    );
    expect(result.success).toBe(false);
    expect(result.state.stages.DebateModerator.status).toBe("pending");
  });

  it("questioner SDK path with default feature flags runs full pipeline", async () => {
    const mockRunner = successRunner;
    const claude = makeFullClaudeAdapterStages2Through7();
    const git = makeGitAdapter();
    const flags = createDefaultFeatureFlags();
    const result = await executeOrchestrator(
      {
        claudeAdapter: claude,
        config: defaultPipelineConfig,
        featureFlags: flags,
        gitAdapter: git,
        questionerRunner: mockRunner,
      },
      undefined,
      "run-full-sdk",
    );
    expect(result.success).toBe(true);
    expect(result.state.state).toBe("completed");
  });

  it("questioner runner that throws is caught and fails stage 1", async () => {
    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();
    const result = await executeOrchestrator(
      {
        claudeAdapter: claude,
        config: defaultPipelineConfig,
        gitAdapter: git,
        questionerRunner: throwingRunner,
      },
      undefined,
      "run-throw",
    );
    expect(result.success).toBe(false);
    expect(result.state.state).toBe("failed");
    expect(result.state.stages.Questioner.error).toBe(
      "questioner_session_failed",
    );
  });

  it("getArtifactAsBriefing returns empty fallback when Questioner artifact is malformed", async () => {
    const getArtifactSpy = vi.spyOn(PipelineStore.prototype, "getArtifact");
    // Return a malformed object that won't pass BriefingResultSchema
    getArtifactSpy.mockImplementation((stage: string): unknown => {
      if ("Questioner" === stage) {
        return { bad: "data" };
      }
      return undefined;
    });
    try {
      const claude = makeFullClaudeAdapterStages2Through7();
      const git = makeGitAdapter();
      const result = await executeOrchestrator(
        {
          claudeAdapter: claude,
          config: defaultPipelineConfig,
          gitAdapter: git,
          questionerRunner: successRunner,
        },
        undefined,
        "run-bad-artifact",
      );
      // Pipeline should still complete — the fallback provides empty defaults
      expect(result.success).toBe(true);
      expect(result.state.state).toBe("completed");
    } finally {
      getArtifactSpy.mockRestore();
    }
  });
});

describe("getStageName — invalid index", () => {
  it("throws for index 0 (below valid range)", () => {
    expect(() => getStageName(0)).toThrow("Invalid stage index: 0");
  });

  it("throws for index 8 (above valid range)", () => {
    expect(() => getStageName(8)).toThrow("Invalid stage index: 8");
  });

  it("throws for negative index", () => {
    expect(() => getStageName(-1)).toThrow("Invalid stage index: -1");
  });

  it("returns valid stage name for index 1", () => {
    expect(getStageName(1)).toBe("Questioner");
  });

  it("returns valid stage name for index 7", () => {
    expect(getStageName(7)).toBe("ForkJoin");
  });
});

describe("executeStage — Questioner case", () => {
  it("returns error when called with Questioner stageName", async () => {
    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();
    const store = new PipelineStore();
    const result = await executeStage(
      "Questioner",
      { claudeAdapter: claude, gitAdapter: git },
      defaultPipelineConfig,
      store,
      "run-test",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("questioner_uses_sdk_path");
  });
});
