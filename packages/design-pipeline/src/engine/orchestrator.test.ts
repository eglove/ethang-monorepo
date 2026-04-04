import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import type { ClaudeAdapter, ClaudeResult } from "../ports/claude-adapter.ts";
import type { GitAdapter } from "../ports/git-adapter.ts";

import { defaultPipelineConfig } from "../constants.ts";
import { executeOrchestrator } from "./orchestrator.ts";

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

function makeFullClaudeAdapter(): ClaudeAdapter {
  let callIndex = 0;
  const responses: ClaudeResult[] = [
    // Stage 1: streaming + execute
    { data: {}, ok: true },
    {
      data: { constraints: ["c"], requirements: ["r"], summary: "S" },
      ok: true,
    },
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

describe("Pipeline Orchestrator", () => {
  it("full happy-path run executes all 7 stages and completes", async () => {
    const claude = makeFullClaudeAdapter();
    const git = makeGitAdapter();
    const result = await executeOrchestrator(
      { claudeAdapter: claude, config: defaultPipelineConfig, gitAdapter: git },
      undefined,
      "run-1",
    );
    expect(result.success).toBe(true);
    expect(result.state.state).toBe("completed");
  });

  it("failure at stage 1 with checkpoint=0 fails without compensation", async () => {
    const config = {
      ...defaultPipelineConfig,
      maxRetries: 1,
      maxStreamTurns: 1,
    };
    const claude = makeClaudeAdapter({
      0: { data: {}, ok: true },
      1: { data: { bad: true }, ok: true },
      2: { data: { bad: true }, ok: true },
    });
    const git = makeGitAdapter();
    const result = await executeOrchestrator(
      { claudeAdapter: claude, config, gitAdapter: git },
      undefined,
      "run-1",
    );
    expect(result.success).toBe(false);
    expect(result.state.state).toBe("failed");
  });

  it("streaming failure at questioner triggers handleFailure with no checkpoint", async () => {
    const config = {
      ...defaultPipelineConfig,
      maxRetries: 1,
      maxStreamTurns: 1,
    };
    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();
    const result = await executeOrchestrator(
      { claudeAdapter: claude, config, gitAdapter: git },
      { Questioner: ["msg1", "msg2"] },
      "run-stream-fail",
    );
    expect(result.success).toBe(false);
    expect(result.state.state).toBe("failed");
    expect(result.state.stages.Questioner.error).toBe("stream_limit_exceeded");
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
    const result = await executeOrchestrator(
      {
        claudeAdapter: failAtPairRouting,
        config: defaultPipelineConfig,
        gitAdapter: git,
      },
      undefined,
      "run-pair-fail",
    );
    expect(result.success).toBe(false);
  });

  it("creates a new store per invocation (instance-scoped)", async () => {
    const claude1 = makeFullClaudeAdapter();
    const claude2 = makeFullClaudeAdapter();
    const git = makeGitAdapter();
    const result1 = await executeOrchestrator(
      {
        claudeAdapter: claude1,
        config: defaultPipelineConfig,
        gitAdapter: git,
      },
      undefined,
      "run-1",
    );
    const result2 = await executeOrchestrator(
      {
        claudeAdapter: claude2,
        config: defaultPipelineConfig,
        gitAdapter: git,
      },
      undefined,
      "run-2",
    );
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.state).not.toBe(result2.state);
  });
});
