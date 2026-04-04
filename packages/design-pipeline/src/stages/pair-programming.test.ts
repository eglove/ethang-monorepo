import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import type { ClaudeResult } from "../ports/claude-adapter.ts";
import type { GitAdapter } from "../ports/git-adapter.ts";

import { defaultPipelineConfig } from "../constants.ts";
import { TestPipelineStore } from "../engine/test-store.ts";
import {
  executePairProgramming,
  executePairRouting,
} from "./pair-programming.ts";

const BRANCH_NAME = "feat/test";
const COMMIT_MESSAGE = "feat: done";

function makeClaudeAdapter(responses: ClaudeResult[]) {
  let index = 0;
  return {
    async executePrompt() {
      await Promise.resolve();
      const r = responses[index] ?? { data: {}, ok: true as const };
      index += 1;
      return r;
    },
    async routePairMessage() {
      await Promise.resolve();
      const r = responses[index] ?? { data: {}, ok: true as const };
      index += 1;
      return r;
    },
    async streamPrompt() {
      await Promise.resolve();
      return { data: {}, ok: true as const };
    },
  };
}

function makeGitAdapter(commitOk = true): GitAdapter {
  let lockOwner: string | undefined;
  return {
    acquireLock: (owner: string) => {
      if (lockOwner !== undefined) {
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
      return { ok: commitOk };
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

const validPlan = {
  steps: [{ files: ["f.ts"], id: "T1", title: "Step" }],
  tiers: [{ taskIds: ["T1"], tier: 1 }],
};

describe("Pair Routing", () => {
  it("pair routing completes -> executing", async () => {
    const adapter = makeClaudeAdapter([{ data: {}, ok: true }]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 6;
      draft.stages.PairProgramming.status = "pair_routing";
    });
    const result = await executePairRouting(
      adapter,
      store,
      validPlan,
      defaultPipelineConfig,
    );
    expect(result.success).toBe(true);
    expect(store.state.stages.PairProgramming.status).toBe("executing");
  });

  it("Claude API failure during pair_routing triggers retry (Gap 7)", async () => {
    const adapter = makeClaudeAdapter([
      { errorKind: "claude_api_timeout", message: "Timeout", ok: false },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 6;
      draft.stages.PairProgramming.status = "pair_routing";
    });
    const result = await executePairRouting(
      adapter,
      store,
      validPlan,
      defaultPipelineConfig,
    );
    expect(result.success).toBe(false);
    expect(store.state.stages.PairProgramming.status).toBe("retrying");
    expect(store.state.stages.PairProgramming.error).toBe(
      "pair_routing_api_failed",
    );
  });
});

describe("Pair Programming Execution", () => {
  it("execution produces a PairSessionResult and git succeeds", async () => {
    const adapter = makeClaudeAdapter([
      {
        data: {
          branchName: BRANCH_NAME,
          commitMessage: COMMIT_MESSAGE,
          completedTasks: ["T1"],
          testsPassed: true,
        },
        ok: true,
      },
    ]);
    const git = makeGitAdapter();
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 6;
      draft.stages.PairProgramming.status = "executing";
    });
    const result = await executePairProgramming(
      adapter,
      git,
      defaultPipelineConfig,
      store,
      validPlan,
      "run-1",
    );
    expect(result.success).toBe(true);
    expect(store.state.stages.PairProgramming.status).toBe("completed");
  });

  it("git failure triggers retry (Gap 1)", async () => {
    const adapter = makeClaudeAdapter([
      {
        data: {
          branchName: BRANCH_NAME,
          commitMessage: COMMIT_MESSAGE,
          completedTasks: ["T1"],
          testsPassed: true,
        },
        ok: true,
      },
    ]);
    const git = makeGitAdapter(false);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 6;
      draft.stages.PairProgramming.status = "executing";
    });
    const result = await executePairProgramming(
      adapter,
      git,
      defaultPipelineConfig,
      store,
      validPlan,
      "run-1",
    );
    expect(result.success).toBe(false);
    expect(store.state.stages.PairProgramming.status).toBe("retrying");
    expect(store.state.stages.PairProgramming.error).toBe("git_failure");
  });

  it("git retry exhausted -> failed", async () => {
    const adapter = makeClaudeAdapter([
      {
        data: {
          branchName: BRANCH_NAME,
          commitMessage: COMMIT_MESSAGE,
          completedTasks: ["T1"],
          testsPassed: true,
        },
        ok: true,
      },
    ]);
    const git = makeGitAdapter(false);
    const store = new TestPipelineStore();
    const config = { ...defaultPipelineConfig, maxRetries: 3 };
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 6;
      draft.stages.PairProgramming.status = "executing";
      draft.stages.PairProgramming.retries = 3;
    });
    const result = await executePairProgramming(
      adapter,
      git,
      config,
      store,
      validPlan,
      "run-1",
    );
    expect(result.success).toBe(false);
    expect(store.state.stages.PairProgramming.status).toBe("failed");
    expect(store.state.stages.PairProgramming.error).toBe(
      "git_retry_exhausted",
    );
  });

  it("git lock is released on both success and failure", async () => {
    const git = makeGitAdapter(false);
    const adapter = makeClaudeAdapter([
      {
        data: {
          branchName: BRANCH_NAME,
          commitMessage: COMMIT_MESSAGE,
          completedTasks: ["T1"],
          testsPassed: true,
        },
        ok: true,
      },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 6;
      draft.stages.PairProgramming.status = "executing";
    });
    await executePairProgramming(
      adapter,
      git,
      defaultPipelineConfig,
      store,
      validPlan,
      "run-1",
    );
    expect(git.acquireLock("run-2")).toBe(true);
  });
});
