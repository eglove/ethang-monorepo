import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import type { ClaudeResult } from "../ports/claude-adapter.ts";
import type { GitAdapter } from "../ports/git-adapter.ts";

import { defaultPipelineConfig } from "../constants.ts";
import { TestPipelineStore } from "../engine/test-store.ts";
import { executeForkJoin } from "./fork-join.ts";

const BRANCH_NAME = "feat/fork";

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
      return { data: {}, ok: true as const };
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

const PLANT_UML_STUB = "@startuml\n@enduml";

const validPairResult = {
  branchName: "feat/test",
  commitMessage: "feat: done",
  completedTasks: ["T1"],
  testsPassed: true,
};

describe("Fork-Join", () => {
  it("valid ForkJoinResult passes validation and git succeeds", async () => {
    const adapter = makeClaudeAdapter([
      {
        data: {
          branchName: BRANCH_NAME,
          commitMessage: "feat: fork-join",
          plantUml: PLANT_UML_STUB,
          reviewSummary: "All good",
        },
        ok: true,
      },
    ]);
    const git = makeGitAdapter();
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 7;
      draft.stages.ForkJoin.status = "executing";
    });
    const result = await executeForkJoin(
      adapter,
      git,
      defaultPipelineConfig,
      store,
      validPairResult,
      "run-1",
    );
    expect(result.success).toBe(true);
    expect(store.state.stages.ForkJoin.status).toBe("completed");
  });

  it("git failure triggers retry (Gap 1)", async () => {
    const adapter = makeClaudeAdapter([
      {
        data: {
          branchName: BRANCH_NAME,
          commitMessage: "feat: fork-join",
          plantUml: PLANT_UML_STUB,
          reviewSummary: "Good",
        },
        ok: true,
      },
    ]);
    const git = makeGitAdapter(false);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 7;
      draft.stages.ForkJoin.status = "executing";
    });
    const result = await executeForkJoin(
      adapter,
      git,
      defaultPipelineConfig,
      store,
      validPairResult,
      "run-1",
    );
    expect(result.success).toBe(false);
    expect(store.state.stages.ForkJoin.status).toBe("retrying");
    expect(store.state.stages.ForkJoin.error).toBe("git_failure");
  });

  it("stage 7 completion triggers run completion path", async () => {
    const adapter = makeClaudeAdapter([
      {
        data: {
          branchName: BRANCH_NAME,
          commitMessage: "feat: final",
          plantUml: PLANT_UML_STUB,
          reviewSummary: "Done",
        },
        ok: true,
      },
    ]);
    const git = makeGitAdapter();
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 7;
      draft.stages.ForkJoin.status = "executing";
    });
    const result = await executeForkJoin(
      adapter,
      git,
      defaultPipelineConfig,
      store,
      validPairResult,
      "run-1",
    );
    expect(result.success).toBe(true);
    expect(store.state.stages.ForkJoin.status).toBe("completed");
    expect(store.state.stages.ForkJoin.artifact).toBeDefined();
  });
});
