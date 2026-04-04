import { describe, expect, it } from "vitest";

import type { ClaudeAdapter, ClaudeResult } from "./ports/claude-adapter.ts";
import type { GitAdapter } from "./ports/git-adapter.ts";

import { defaultPipelineConfig } from "./constants.ts";
import { executeOrchestrator } from "./engine/orchestrator.ts";
import { runPipeline } from "./index.ts";

function makeFullClaudeAdapter(): ClaudeAdapter {
  let callIndex = 0;
  const responses: ClaudeResult[] = [
    { data: {}, ok: true },
    {
      data: { constraints: ["c"], requirements: ["r"], summary: "S" },
      ok: true,
    },
    {
      data: { consensus: "C", dissent: [], recommendations: ["r"] },
      ok: true,
    },
    {
      data: { cfgContent: "C", tlaContent: "T", tlcOutput: "O" },
      ok: true,
    },
    { data: { amendments: [], consensus: "R", gaps: [] }, ok: true },
    { data: {}, ok: true },
    {
      data: {
        steps: [{ files: ["f.ts"], id: "T1", title: "S" }],
        tiers: [{ taskIds: ["T1"], tier: 1 }],
      },
      ok: true,
    },
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
        claudeAdapter: makeFullClaudeAdapter(),
        config: defaultPipelineConfig,
        gitAdapter: makeGitAdapter(),
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
        claudeAdapter: makeFullClaudeAdapter(),
        config: defaultPipelineConfig,
        gitAdapter: makeGitAdapter(),
      },
      undefined,
      "test-run",
    );
    expect(result.success).toBe(true);
    expect(result.artifacts).toBeDefined();
  });

  it("failed pipeline returns error details", async () => {
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
      },
      undefined,
      "test-fail",
    );
    expect(result.success).toBe(false);
    expect(result.state.state).toBe("failed");
  });
});
