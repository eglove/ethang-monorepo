import { describe, expect, it } from "vitest";

import type { ClaudeAdapter, ClaudeResult } from "./ports/claude-adapter.ts";
import type { GitAdapter } from "./ports/git-adapter.ts";
import type { SessionResult } from "./stages/questioner-session.ts";

import { defaultPipelineConfig } from "./constants.ts";
import {
  executeOrchestrator,
  type QuestionerRunner,
} from "./engine/orchestrator.ts";
import { runPipeline } from "./index.ts";

// eslint-disable-next-line @typescript-eslint/require-await
const failedQuestionerRunner: QuestionerRunner = async () => ({
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
});

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
    async getCurrentBranch() {
      await Promise.resolve();
      return "main";
    },
    async push() {
      await Promise.resolve();
      return { ok: true };
    },
    releaseLock() {
      lockOwner = undefined;
    },
  };
}

// eslint-disable-next-line @typescript-eslint/require-await
const questionerRunner: QuestionerRunner = async () =>
  makeSuccessfulSessionResult();

function makeStages2Through7Adapter(): ClaudeAdapter {
  let callIndex = 0;
  const responses: ClaudeResult[] = [
    // Stage 2 (DebateModerator): execute
    {
      data: { consensus: "C", dissent: [], recommendations: ["r"] },
      ok: true,
    },
    // Stage 3 (TlaWriter): execute
    {
      data: { cfgContent: "C", tlaContent: "T", tlcOutput: "O" },
      ok: true,
    },
    // Stage 4 (ExpertReview): execute
    { data: { amendments: [], consensus: "R", gaps: [] }, ok: true },
    // Stage 5 (ImplementationPlanning): streaming + execute
    { data: {}, ok: true },
    {
      data: {
        steps: [{ files: ["f.ts"], id: "T1", title: "S" }],
        tiers: [{ taskIds: ["T1"], tier: 1 }],
      },
      ok: true,
    },
    // Stage 6 (PairProgramming): pair routing + execute
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
    // Stage 7 (ForkJoin): execute
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

function makeSuccessfulSessionResult(): SessionResult {
  return {
    artifact: {
      artifactState: "complete",
      questions: [{ answer: "constraint-1", question: "requirement-1" }],
      sessionState: "completed",
      summary: "Test summary",
      turnCount: 2,
    },
    briefingPath: null,
    success: true,
  };
}

describe("runPipeline", () => {
  it("is exported as a zero-arg function", () => {
    expect(typeof runPipeline).toBe("function");
    expect(runPipeline).toHaveLength(0);
  });
});

describe("executeOrchestrator", () => {
  it("with mock adapters completes all 7 stages", async () => {
    const result = await executeOrchestrator(
      {
        claudeAdapter: makeStages2Through7Adapter(),
        config: defaultPipelineConfig,
        gitAdapter: makeGitAdapter(),
        questionerRunner,
      },
      undefined,
      "test-run",
    );
    expect(result.success).toBe(true);
    expect(result.state.state).toBe("completed");
  });

  it("successful pipeline returns all 7 stage artifacts", async () => {
    const result = await executeOrchestrator(
      {
        claudeAdapter: makeStages2Through7Adapter(),
        config: defaultPipelineConfig,
        gitAdapter: makeGitAdapter(),
        questionerRunner,
      },
      undefined,
      "test-run",
    );
    expect(result.success).toBe(true);
    expect(result.artifacts).toBeDefined();
  });

  it("failed pipeline returns error details", async () => {
    const failRunner = failedQuestionerRunner;
    const failAdapter: ClaudeAdapter = {
      async executePrompt() {
        await Promise.resolve();
        return {
          data: { bad: true },
          ok: true as const,
        };
      },
      async routePairMessage() {
        await Promise.resolve();
        return { data: {}, ok: true as const };
      },
      async streamPrompt() {
        await Promise.resolve();
        return { data: {}, ok: true as const };
      },
    };
    const result = await executeOrchestrator(
      {
        claudeAdapter: failAdapter,
        config: { maxRetries: 1, maxStreamTurns: 1, retryBaseDelayMs: 0 },
        gitAdapter: makeGitAdapter(),
        questionerRunner: failRunner,
      },
      undefined,
      "test-fail",
    );
    expect(result.success).toBe(false);
    expect(result.state.state).toBe("failed");
  });
});
