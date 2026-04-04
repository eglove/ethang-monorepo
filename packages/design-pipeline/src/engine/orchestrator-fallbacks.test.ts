import constant from "lodash/constant.js";
import noop from "lodash/noop.js";
import { describe, expect, it, vi } from "vitest";

import type { ClaudeAdapter, ClaudeResult } from "../ports/claude-adapter.ts";
import type { GitAdapter } from "../ports/git-adapter.ts";
import type { PipelineStore } from "./pipeline-store.ts";

import { defaultPipelineConfig } from "../constants.ts";

// Mock all stage executors to return success with NO artifact,
// so the ?? fallback branches in orchestrator.ts get exercised.
// Each mock must properly transition the store state.
vi.mock("../stages/questioner.ts", () => ({
  async executeQuestioner(
    _adapter: ClaudeAdapter,
    _config: unknown,
    store: PipelineStore,
  ) {
    await Promise.resolve();
    store.finishExecution();
    store.validationPass();
    return { artifact: undefined, success: true };
  },
  async executeStreaming(
    _adapter: ClaudeAdapter,
    store: PipelineStore,
    maxStreamTurns: number,
  ) {
    await Promise.resolve();
    store.streamInput(maxStreamTurns);
    return { turns: 1 };
  },
}));

vi.mock("../stages/debate-moderator.ts", () => ({
  async executeDebateModerator(
    _adapter: ClaudeAdapter,
    _config: unknown,
    store: PipelineStore,
  ) {
    await Promise.resolve();
    store.finishExecution();
    store.validationPass();
    return { artifact: undefined, success: true };
  },
}));

vi.mock("../stages/tla-writer.ts", () => ({
  async executeTlaWriter(
    _adapter: ClaudeAdapter,
    _config: unknown,
    store: PipelineStore,
  ) {
    await Promise.resolve();
    store.finishExecution();
    store.validationPass();
    return { artifact: undefined, success: true };
  },
}));

vi.mock("../stages/expert-review.ts", () => ({
  async executeExpertReview(
    _adapter: ClaudeAdapter,
    _config: unknown,
    store: PipelineStore,
  ) {
    await Promise.resolve();
    store.finishExecution();
    store.validationPass();
    return { artifact: undefined, success: true };
  },
}));

vi.mock("../stages/implementation-planning.ts", () => ({
  async executeImplementationPlanning(
    _adapter: ClaudeAdapter,
    _config: unknown,
    store: PipelineStore,
  ) {
    await Promise.resolve();
    store.finishExecution();
    store.validationPass();
    return { artifact: undefined, success: true };
  },
  async executeStreamingConfirmation(
    _adapter: ClaudeAdapter,
    store: PipelineStore,
    maxStreamTurns: number,
  ) {
    await Promise.resolve();
    store.streamInput(maxStreamTurns);
    return { turns: 1 };
  },
}));

vi.mock("../stages/pair-programming.ts", () => ({
  async executePairProgramming(
    _adapter: ClaudeAdapter,
    _git: GitAdapter,
    _config: unknown,
    store: PipelineStore,
  ) {
    await Promise.resolve();
    store.finishExecution();
    store.validationPass();
    store.gitSuccess();
    return { artifact: undefined, success: true };
  },
  async executePairRouting(_adapter: ClaudeAdapter, store: PipelineStore) {
    await Promise.resolve();
    store.completePairRouting();
    return { success: true };
  },
}));

vi.mock("../stages/fork-join.ts", () => ({
  async executeForkJoin(
    _adapter: ClaudeAdapter,
    _git: GitAdapter,
    _config: unknown,
    store: PipelineStore,
  ) {
    await Promise.resolve();
    store.finishExecution();
    store.validationPass();
    store.gitSuccess();
    return { artifact: undefined, success: true };
  },
}));

function makeClaudeAdapter(): ClaudeAdapter {
  const defaultResponse: ClaudeResult = { data: {}, ok: true };
  return {
    async executePrompt() {
      await Promise.resolve();
      return defaultResponse;
    },
    async routePairMessage() {
      await Promise.resolve();
      return defaultResponse;
    },
    async streamPrompt() {
      await Promise.resolve();
      return defaultResponse;
    },
  };
}

function makeGitAdapter(): GitAdapter {
  return {
    acquireLock: constant(true),
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
    releaseLock: noop,
  };
}

describe("Orchestrator ?? fallback branches", () => {
  it("exercises all ?? fallbacks when stage artifacts are missing", async () => {
    const { executeOrchestrator } = await import("../engine/orchestrator.ts");

    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();
    const result = await executeOrchestrator(
      { claudeAdapter: claude, config: defaultPipelineConfig, gitAdapter: git },
      undefined,
      "run-fallback",
    );

    expect(result.success).toBe(true);
    expect(result.state.state).toBe("completed");
  });

  it("uses default config and runId when not provided", async () => {
    const { executeOrchestrator } = await import("../engine/orchestrator.ts");

    const claude = makeClaudeAdapter();
    const git = makeGitAdapter();
    const result = await executeOrchestrator({
      claudeAdapter: claude,
      gitAdapter: git,
    });

    expect(result.success).toBe(true);
  });
});
