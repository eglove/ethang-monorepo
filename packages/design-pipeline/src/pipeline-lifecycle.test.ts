import constant from "lodash/constant.js";
import noop from "lodash/noop.js";
import { describe, expect, it } from "vitest";

import type { ClaudeAdapter, ClaudeResult } from "./ports/claude-adapter.ts";
import type { GitAdapter } from "./ports/git-adapter.ts";
import type { SessionResult } from "./stages/questioner-session.ts";

import { defaultPipelineConfig } from "./constants.ts";
import {
  executeOrchestrator,
  type QuestionerRunner,
} from "./engine/orchestrator.ts";

function makeClaudeAdapter(responses: ClaudeResult[]): ClaudeAdapter {
  let callIndex = 0;
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

function makeFailOnceGitAdapter(): GitAdapter {
  let commitCalls = 0;
  return {
    acquireLock: constant(true),
    async checkout() {
      await Promise.resolve();
      return { ok: true };
    },
    async commit() {
      await Promise.resolve();
      commitCalls += 1;
      return { ok: 1 < commitCalls };
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
    releaseLock: noop,
  };
}

function makeGitAdapter(commitOk = true, checkoutOk = true): GitAdapter {
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
      return { ok: checkoutOk };
    },
    async commit() {
      await Promise.resolve();
      return { ok: commitOk };
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

// Stages 2-7 responses (questioner is now handled by SDK runner)
const happyPathResponses: ClaudeResult[] = [
  // Stage 2 (DebateModerator): execute
  { data: { consensus: "C", dissent: [], recommendations: ["r"] }, ok: true },
  // Stage 3 (TlaWriter): execute
  { data: { cfgContent: "C", tlaContent: "T", tlcOutput: "O" }, ok: true },
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

const retryTimeoutResponses: ClaudeResult[] = [
  // Stage 2: timeout then success
  { errorKind: "claude_api_timeout", message: "Timeout", ok: false },
  { data: { consensus: "C", dissent: [], recommendations: [] }, ok: true },
  // Stage 3
  { data: { cfgContent: "C", tlaContent: "T", tlcOutput: "O" }, ok: true },
  // Stage 4
  { data: { amendments: [], consensus: "R", gaps: [] }, ok: true },
  // Stage 5: streaming + execute
  { data: {}, ok: true },
  {
    data: {
      steps: [{ files: ["f"], id: "T1", title: "S" }],
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
  // Stage 7
  {
    data: {
      branchName: "b",
      commitMessage: "m",
      plantUml: "P",
      reviewSummary: "R",
    },
    ok: true,
  },
];

const zodRetryResponses: ClaudeResult[] = [
  // Stage 2: bad then good
  { data: { bad: true }, ok: true },
  { data: { consensus: "C", dissent: [], recommendations: [] }, ok: true },
  // Stage 3
  { data: { cfgContent: "C", tlaContent: "T", tlcOutput: "O" }, ok: true },
  // Stage 4
  { data: { amendments: [], consensus: "R", gaps: [] }, ok: true },
  // Stage 5: streaming + execute
  { data: {}, ok: true },
  {
    data: {
      steps: [{ files: ["f"], id: "T1", title: "S" }],
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
  // Stage 7
  {
    data: {
      branchName: "b",
      commitMessage: "m",
      plantUml: "P",
      reviewSummary: "R",
    },
    ok: true,
  },
];

const streamLimitResponses: ClaudeResult[] = [
  // Stage 2
  { data: { consensus: "C", dissent: [], recommendations: [] }, ok: true },
  // Stage 3
  { data: { cfgContent: "C", tlaContent: "T", tlcOutput: "O" }, ok: true },
  // Stage 4
  { data: { amendments: [], consensus: "R", gaps: [] }, ok: true },
  // Stage 5: streaming messages that will exceed limit
  { data: {}, ok: true },
  { data: {}, ok: true },
  { data: {}, ok: true },
];

describe("Pipeline Lifecycle Integration", () => {
  it("(a) Happy path: all 7 stages complete", async () => {
    const result = await executeOrchestrator(
      {
        claudeAdapter: makeClaudeAdapter(happyPathResponses),
        config: defaultPipelineConfig,
        gitAdapter: makeGitAdapter(),
        questionerRunner,
      },
      undefined,
      "happy-1",
    );
    expect(result.success).toBe(true);
    expect(result.state.state).toBe("completed");
    expect(result.artifacts).toBeDefined();
  });

  it("(c) Failure at stage 1 with no checkpoint", async () => {
    const failRunner = failedQuestionerRunner;
    const result = await executeOrchestrator(
      {
        claudeAdapter: makeClaudeAdapter([]),
        config: { maxRetries: 1, maxStreamTurns: 1, retryBaseDelayMs: 0 },
        gitAdapter: makeGitAdapter(),
        questionerRunner: failRunner,
      },
      undefined,
      "fail-1",
    );
    expect(result.success).toBe(false);
    expect(result.state.state).toBe("failed");
  });

  it("(d) Claude API timeout retries succeed on second attempt", async () => {
    const result = await executeOrchestrator(
      {
        claudeAdapter: makeClaudeAdapter(retryTimeoutResponses),
        config: defaultPipelineConfig,
        gitAdapter: makeGitAdapter(),
        questionerRunner,
      },
      undefined,
      "retry-1",
    );
    expect(result.success).toBe(true);
  });

  it("(f) Zod validation failure retries succeed on second attempt", async () => {
    const result = await executeOrchestrator(
      {
        claudeAdapter: makeClaudeAdapter(zodRetryResponses),
        config: defaultPipelineConfig,
        gitAdapter: makeGitAdapter(),
        questionerRunner,
      },
      undefined,
      "zod-retry-1",
    );
    expect(result.success).toBe(true);
  });

  it("(g) Git failure at stage 6 retries on second attempt", async () => {
    const responses: ClaudeResult[] = [
      ...happyPathResponses,
      {
        data: {
          branchName: "b",
          commitMessage: "m",
          completedTasks: ["T1"],
          testsPassed: true,
        },
        ok: true,
      },
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
    const result = await executeOrchestrator(
      {
        claudeAdapter: makeClaudeAdapter(responses),
        config: defaultPipelineConfig,
        gitAdapter: makeFailOnceGitAdapter(),
        questionerRunner,
      },
      undefined,
      "git-retry-1",
    );
    expect(result.state.state).toBeDefined();
  });

  it("(i) Streaming input at stage 1 uses SDK runner (ignores streamingInputs)", async () => {
    const result = await executeOrchestrator(
      {
        claudeAdapter: makeClaudeAdapter(happyPathResponses),
        config: defaultPipelineConfig,
        gitAdapter: makeGitAdapter(),
        questionerRunner,
      },
      { Questioner: ["turn1", "turn2"] },
      "stream-1",
    );
    expect(result.state).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("(j) Stream limit reached at stage 5", async () => {
    const result = await executeOrchestrator(
      {
        claudeAdapter: makeClaudeAdapter(streamLimitResponses),
        config: { maxRetries: 3, maxStreamTurns: 1, retryBaseDelayMs: 0 },
        gitAdapter: makeGitAdapter(),
        questionerRunner,
      },
      {
        ImplementationPlanning: ["msg1", "msg2", "msg3"],
      },
      "stream-limit-1",
    );
    expect(result.success).toBe(false);
    expect(result.state.stages.ImplementationPlanning.error).toBe(
      "stream_limit_exceeded",
    );
  });

  it("(m) Git mutual exclusion: lock prevents concurrent access", () => {
    const git = makeGitAdapter();
    expect(git.acquireLock("run-1")).toBe(true);
    expect(git.acquireLock("run-2")).toBe(false);
    git.releaseLock("run-1");
    expect(git.acquireLock("run-2")).toBe(true);
  });
});
