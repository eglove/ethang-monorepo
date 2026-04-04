import constant from "lodash/constant.js";
import noop from "lodash/noop.js";
import { describe, expect, it } from "vitest";

import type { GitAdapter } from "../ports/git-adapter.ts";

import {
  executeCompensation,
  shouldCompensate,
  shouldFailDirectly,
} from "./compensation.ts";
import { TestPipelineStore } from "./test-store.ts";

const makeGitAdapter = (checkoutOk = true): GitAdapter => {
  return {
    acquireLock: constant(true),
    checkout: async () => {
      await Promise.resolve();
      return { ok: checkoutOk };
    },
    commit: async () => {
      await Promise.resolve();
      return { ok: true };
    },
    createBranch: async () => {
      await Promise.resolve();
      return { ok: true };
    },
    getCurrentBranch: async () => {
      await Promise.resolve();
      return "main";
    },
    push: async () => {
      await Promise.resolve();
      return { ok: true };
    },
    releaseLock: noop,
  };
};

describe("Compensation Coordinator", () => {
  it("stage failure with checkpoint > 0 begins compensation", () => {
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.checkpoint = 2;
    });
    expect(shouldCompensate(store)).toBe(true);
  });

  it("stage failure with checkpoint = 0 fails run directly", () => {
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.checkpoint = 0;
    });
    expect(shouldFailDirectly(store)).toBe(true);
    expect(shouldCompensate(store)).toBe(false);
  });

  it("compensation completes successfully -> compensated stages, run failed", async () => {
    const git = makeGitAdapter();
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "compensating";
      draft.currentStage = 3;
      draft.checkpoint = 2;
      draft.stages.Questioner.status = "completed";
      draft.stages.Questioner.artifact = { data: "test" };
      draft.stages.DebateModerator.status = "completed";
      draft.stages.DebateModerator.artifact = { data: "test2" };
    });
    const result = await executeCompensation(store, git, "run-1");
    expect(result.success).toBe(true);
    expect(store.state.state).toBe("failed");
    expect(store.state.stages.Questioner.status).toBe("compensated");
    expect(store.state.stages.DebateModerator.status).toBe("compensated");
  });

  it("compensation failure -> compensation_failed state (Gap 2)", async () => {
    const git = makeGitAdapter(false);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "compensating";
      draft.currentStage = 3;
      draft.checkpoint = 2;
      draft.stages.Questioner.status = "completed";
      draft.stages.Questioner.artifact = { data: "test" };
    });
    const result = await executeCompensation(store, git, "run-1");
    expect(result.success).toBe(false);
    expect(store.state.stages.Questioner.status).toBe("compensation_failed");
    expect(store.state.state).toBe("failed");
  });

  it("compensation releases git lock if held", async () => {
    const git = makeGitAdapter();
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "compensating";
      draft.checkpoint = 1;
      draft.stages.Questioner.status = "completed";
    });
    const result = await executeCompensation(store, git, "run-1");
    expect(result.success).toBe(true);
    expect(git.acquireLock("run-2")).toBe(true);
  });

  it("completed run is never compensated (not compensating state)", async () => {
    const git = makeGitAdapter();
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "completed";
      draft.checkpoint = 7;
    });
    const result = await executeCompensation(store, git, "run-1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Run not compensating");
  });

  it("compensating with checkpoint=0 returns no checkpoint error", async () => {
    const git = makeGitAdapter();
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "compensating";
      draft.checkpoint = 0;
    });
    const result = await executeCompensation(store, git, "run-1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("No checkpoint to compensate");
  });

  it("skips non-completed stages during compensation", async () => {
    const git = makeGitAdapter();
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "compensating";
      draft.currentStage = 3;
      draft.checkpoint = 2;
      draft.stages.Questioner.status = "failed";
      draft.stages.DebateModerator.status = "completed";
      draft.stages.DebateModerator.artifact = { data: "test" };
    });
    const result = await executeCompensation(store, git, "run-1");
    expect(result.success).toBe(true);
    expect(store.state.stages.Questioner.status).toBe("failed");
    expect(store.state.stages.DebateModerator.status).toBe("compensated");
  });

  it("compensates stages without artifacts (no git reversal)", async () => {
    const git = makeGitAdapter();
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "compensating";
      draft.currentStage = 2;
      draft.checkpoint = 1;
      draft.stages.Questioner.status = "completed";
    });
    const result = await executeCompensation(store, git, "run-1");
    expect(result.success).toBe(true);
    expect(store.state.stages.Questioner.status).toBe("compensated");
  });
});
