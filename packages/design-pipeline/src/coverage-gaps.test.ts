import isObject from "lodash/isObject.js";
import { describe, expect, it } from "vitest";

import type { ClaudeResult } from "./ports/claude-adapter.ts";
import type { GitAdapter } from "./ports/git-adapter.ts";

import { ClaudeSdkAdapter } from "./adapters/claude-sdk.ts";
import { ChildProcessGitAdapter } from "./adapters/git-child-process.ts";
import { defaultPipelineConfig } from "./constants.ts";
import { TestPipelineStore } from "./engine/test-store.ts";
import {
  executeWithValidation,
  getStageRecord,
} from "./stages/base-coordinator.ts";
import { executeDebateModerator } from "./stages/debate-moderator.ts";
import { executeExpertReview } from "./stages/expert-review.ts";
import { executeForkJoin } from "./stages/fork-join.ts";
import { executeImplementationPlanning } from "./stages/implementation-planning.ts";
import {
  executePairProgramming,
  executePairRouting,
} from "./stages/pair-programming.ts";
import { executeQuestioner } from "./stages/questioner.ts";
import { executeTlaWriter } from "./stages/tla-writer.ts";

function makeAdapter(responses: ClaudeResult[]) {
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
      const r = responses[index] ?? { data: {}, ok: true as const };
      index += 1;
      return r;
    },
  };
}

function makeGitAdapter(commitOk = true): GitAdapter {
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

function makeStoreAtStage(stage: number, stageName: string, status: string) {
  const store = new TestPipelineStore();
  store.forceState((draft) => {
    draft.state = "running";
    draft.currentStage = stage;
    const stages = draft.stages as Record<
      string,
      { status: string } | undefined
    >;
    const s = stages[stageName];
    if (s !== undefined) {
      s.status = status;
    }
  });
  return store;
}

describe("base-coordinator coverage", () => {
  it("getStageRecord returns the record for a stage", () => {
    const store = new TestPipelineStore();
    const record = getStageRecord(store, "Questioner");
    expect(record.status).toBe("pending");
  });

  it("executeWithValidation handles Claude API failure then success", async () => {
    const adapter = makeAdapter([
      { errorKind: "claude_api_timeout", message: "Timeout", ok: false },
      {
        data: { constraints: ["c"], requirements: ["r"], summary: "S" },
        ok: true,
      },
    ]);
    const store = makeStoreAtStage(1, "Questioner", "executing");
    const result = await executeWithValidation(
      adapter,
      "prompt",
      (data) => {
        if (isObject(data) && "summary" in data) {
          return { data, success: true };
        }
        return { error: "invalid", success: false };
      },
      defaultPipelineConfig,
      store,
    );
    expect(result.success).toBe(true);
  });

  it("executeWithValidation exhausts retries on API failure", async () => {
    const config = { ...defaultPipelineConfig, maxRetries: 1 };
    const adapter = makeAdapter([
      { errorKind: "claude_api_timeout", message: "T", ok: false },
      { errorKind: "claude_api_timeout", message: "T", ok: false },
    ]);
    const store = makeStoreAtStage(1, "Questioner", "executing");
    const result = await executeWithValidation(
      adapter,
      "prompt",
      () => ({ success: true }),
      config,
      store,
    );
    expect(result.success).toBe(false);
    expect(store.state.stages.Questioner.error).toBe("retry_exhausted");
  });

  it("executeQuestioner rejects non-executing", async () => {
    const adapter = makeAdapter([]);
    const store = makeStoreAtStage(1, "Questioner", "pending");
    const result = await executeQuestioner(
      adapter,
      defaultPipelineConfig,
      store,
      "ctx",
    );
    expect(result.success).toBe(false);
  });

  it("executeDebateModerator rejects non-executing", async () => {
    const adapter = makeAdapter([]);
    const store = makeStoreAtStage(2, "DebateModerator", "pending");
    const result = await executeDebateModerator(
      adapter,
      defaultPipelineConfig,
      store,
      {
        constraints: [],
        requirements: [],
        summary: "",
      },
    );
    expect(result.success).toBe(false);
  });

  it("executeTlaWriter rejects non-executing", async () => {
    const adapter = makeAdapter([]);
    const store = makeStoreAtStage(3, "TlaWriter", "pending");
    const result = await executeTlaWriter(
      adapter,
      defaultPipelineConfig,
      store,
      {
        consensus: "",
        dissent: [],
        recommendations: [],
      },
    );
    expect(result.success).toBe(false);
  });

  it("executeExpertReview rejects non-executing", async () => {
    const adapter = makeAdapter([]);
    const store = makeStoreAtStage(4, "ExpertReview", "pending");
    const result = await executeExpertReview(
      adapter,
      defaultPipelineConfig,
      store,
      {
        cfgContent: "",
        tlaContent: "",
        tlcOutput: "",
      },
    );
    expect(result.success).toBe(false);
  });

  it("executeImplementationPlanning rejects non-executing", async () => {
    const adapter = makeAdapter([]);
    const store = makeStoreAtStage(5, "ImplementationPlanning", "pending");
    const result = await executeImplementationPlanning(
      adapter,
      defaultPipelineConfig,
      store,
      {
        briefing: { constraints: [], requirements: [], summary: "" },
        debateSynthesis: { consensus: "", dissent: [], recommendations: [] },
        tlaResult: { cfgContent: "", tlaContent: "", tlcOutput: "" },
        tlaReviewSynthesis: { amendments: [], consensus: "", gaps: [] },
      },
    );
    expect(result.success).toBe(false);
  });

  it("executePairProgramming rejects non-executing", async () => {
    const adapter = makeAdapter([]);
    const git = makeGitAdapter();
    const store = makeStoreAtStage(6, "PairProgramming", "pending");
    const result = await executePairProgramming(
      adapter,
      git,
      defaultPipelineConfig,
      store,
      {
        steps: [],
        tiers: [],
      },
      "r",
    );
    expect(result.success).toBe(false);
  });

  it("executeForkJoin rejects non-executing", async () => {
    const adapter = makeAdapter([]);
    const git = makeGitAdapter();
    const store = makeStoreAtStage(7, "ForkJoin", "pending");
    const result = await executeForkJoin(
      adapter,
      git,
      defaultPipelineConfig,
      store,
      {
        branchName: "",
        commitMessage: "",
        completedTasks: [],
        testsPassed: false,
      },
      "r",
    );
    expect(result.success).toBe(false);
  });

  it("executePairRouting rejects non-pair_routing", async () => {
    const adapter = makeAdapter([]);
    const store = makeStoreAtStage(6, "PairProgramming", "executing");
    const result = await executePairRouting(
      adapter,
      store,
      { steps: [], tiers: [] },
      defaultPipelineConfig,
    );
    expect(result.success).toBe(false);
  });
});

describe("Pair programming - validation failure path", () => {
  it("invalid Claude output triggers validation_failed", async () => {
    const adapter = makeAdapter([{ data: { bad: true }, ok: true }]);
    const git = makeGitAdapter();
    const store = makeStoreAtStage(6, "PairProgramming", "executing");
    const result = await executePairProgramming(
      adapter,
      git,
      defaultPipelineConfig,
      store,
      {
        steps: [],
        tiers: [],
      },
      "r",
    );
    expect(result.success).toBe(false);
    expect(store.state.stages.PairProgramming.error).toBe("zod_validation");
  });

  it("Claude API failure during execution fails stage", async () => {
    const adapter = makeAdapter([
      { errorKind: "claude_api_timeout", message: "T", ok: false },
    ]);
    const git = makeGitAdapter();
    const store = makeStoreAtStage(6, "PairProgramming", "executing");
    const result = await executePairProgramming(
      adapter,
      git,
      defaultPipelineConfig,
      store,
      {
        steps: [],
        tiers: [],
      },
      "r",
    );
    expect(result.success).toBe(false);
  });

  it("git lock acquisition failure fails stage", async () => {
    const git = makeGitAdapter();
    git.acquireLock("other");
    const adapter = makeAdapter([
      {
        data: {
          branchName: "b",
          commitMessage: "m",
          completedTasks: ["T1"],
          testsPassed: true,
        },
        ok: true,
      },
    ]);
    const store = makeStoreAtStage(6, "PairProgramming", "executing");
    const result = await executePairProgramming(
      adapter,
      git,
      defaultPipelineConfig,
      store,
      {
        steps: [],
        tiers: [],
      },
      "another-run",
    );
    expect(result.success).toBe(false);
    expect(store.state.stages.PairProgramming.error).toBe("git_failure");
  });
});

describe("Fork-join coverage gaps", () => {
  it("invalid Claude output triggers validation_failed", async () => {
    const adapter = makeAdapter([{ data: { bad: true }, ok: true }]);
    const git = makeGitAdapter();
    const store = makeStoreAtStage(7, "ForkJoin", "executing");
    const result = await executeForkJoin(
      adapter,
      git,
      defaultPipelineConfig,
      store,
      {
        branchName: "",
        commitMessage: "",
        completedTasks: [],
        testsPassed: false,
      },
      "r",
    );
    expect(result.success).toBe(false);
    expect(store.state.stages.ForkJoin.error).toBe("zod_validation");
  });

  it("Claude API failure fails stage", async () => {
    const adapter = makeAdapter([
      { errorKind: "claude_api_timeout", message: "T", ok: false },
    ]);
    const git = makeGitAdapter();
    const store = makeStoreAtStage(7, "ForkJoin", "executing");
    const result = await executeForkJoin(
      adapter,
      git,
      defaultPipelineConfig,
      store,
      {
        branchName: "",
        commitMessage: "",
        completedTasks: [],
        testsPassed: false,
      },
      "r",
    );
    expect(result.success).toBe(false);
  });

  it("git lock failure fails stage", async () => {
    const git = makeGitAdapter();
    git.acquireLock("other");
    const adapter = makeAdapter([
      {
        data: {
          branchName: "b",
          commitMessage: "m",
          plantUml: "P",
          reviewSummary: "R",
        },
        ok: true,
      },
    ]);
    const store = makeStoreAtStage(7, "ForkJoin", "executing");
    const result = await executeForkJoin(
      adapter,
      git,
      defaultPipelineConfig,
      store,
      {
        branchName: "",
        commitMessage: "",
        completedTasks: [],
        testsPassed: false,
      },
      "another",
    );
    expect(result.success).toBe(false);
    expect(store.state.stages.ForkJoin.error).toBe("git_failure");
  });

  it("git retry exhausted on fork-join", async () => {
    const adapter = makeAdapter([
      {
        data: {
          branchName: "b",
          commitMessage: "m",
          plantUml: "P",
          reviewSummary: "R",
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
      draft.stages.ForkJoin.retries = 3;
    });
    const result = await executeForkJoin(
      adapter,
      git,
      { ...defaultPipelineConfig, maxRetries: 3 },
      store,
      {
        branchName: "",
        commitMessage: "",
        completedTasks: [],
        testsPassed: false,
      },
      "r",
    );
    expect(result.success).toBe(false);
    expect(store.state.stages.ForkJoin.error).toBe("git_retry_exhausted");
  });
});

describe("Pair routing retry exhaustion", () => {
  it("pair routing API fail exhausted -> failed", async () => {
    const adapter = makeAdapter([
      { errorKind: "claude_api_timeout", message: "T", ok: false },
    ]);
    const store = new TestPipelineStore();
    store.forceState((draft) => {
      draft.state = "running";
      draft.currentStage = 6;
      draft.stages.PairProgramming.status = "pair_routing";
      draft.stages.PairProgramming.retries = 3;
    });
    const result = await executePairRouting(
      adapter,
      store,
      { steps: [], tiers: [] },
      { ...defaultPipelineConfig, maxRetries: 3 },
    );
    expect(result.success).toBe(false);
    expect(store.state.stages.PairProgramming.status).toBe("failed");
    expect(store.state.stages.PairProgramming.error).toBe("retry_exhausted");
  });
});

describe("ClaudeSdkAdapter error mapping", () => {
  it("maps rate limit error", () => {
    const adapter = new ClaudeSdkAdapter();
    const result = adapter.mapError(new Error("rate limit exceeded"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorKind).toBe("claude_api_rate_limit");
    }
  });

  it("maps timeout error", () => {
    const adapter = new ClaudeSdkAdapter();
    const result = adapter.mapError(new Error("ETIMEDOUT"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorKind).toBe("claude_api_timeout");
    }
  });

  it("maps generic error", () => {
    const adapter = new ClaudeSdkAdapter();
    const result = adapter.mapError(new Error("unknown"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorKind).toBe("claude_api_timeout");
    }
  });

  it("maps non-Error to string", () => {
    const adapter = new ClaudeSdkAdapter();
    const result = adapter.mapError("string error");
    expect(result.ok).toBe(false);
  });
});

describe("ChildProcessGitAdapter additional coverage", () => {
  it("push returns result", async () => {
    const adapter = new ChildProcessGitAdapter("/test");
    const result = await adapter.push();
    expect(result).toHaveProperty("ok");
  });

  it("checkout returns result", async () => {
    const adapter = new ChildProcessGitAdapter("/test");
    const result = await adapter.checkout("main");
    expect(result).toHaveProperty("ok");
  });

  it("same owner can re-acquire lock", () => {
    const adapter = new ChildProcessGitAdapter("/test");
    adapter.acquireLock("run-1");
    expect(adapter.acquireLock("run-1")).toBe(true);
  });
});

describe("base-coordinator fallback return (line 84)", () => {
  it("returns fallback when maxRetries is negative (while loop never executes)", async () => {
    const adapter = makeAdapter([]);
    const store = makeStoreAtStage(1, "Questioner", "executing");
    const config = { ...defaultPipelineConfig, maxRetries: -1 };
    const result = await executeWithValidation(
      adapter,
      "prompt",
      () => ({ success: true }),
      config,
      store,
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("retry_exhausted");
  });
});

describe("base-coordinator ?? fallback branches", () => {
  it("validation.error ?? fallback fires when validation.error is undefined", async () => {
    const config = { ...defaultPipelineConfig, maxRetries: 0 };
    const adapter = makeAdapter([{ data: { something: true }, ok: true }]);
    const store = makeStoreAtStage(1, "Questioner", "executing");
    const result = await executeWithValidation(
      adapter,
      "prompt",
      () => ({ success: false }),
      config,
      store,
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("validation_failed");
  });

  it("validation.data ?? result.data fires when validation.data is undefined", async () => {
    const adapter = makeAdapter([{ data: { fallbackData: true }, ok: true }]);
    const store = makeStoreAtStage(1, "Questioner", "executing");
    const result = await executeWithValidation(
      adapter,
      "prompt",
      () => ({ success: true }),
      defaultPipelineConfig,
      store,
    );
    expect(result.success).toBe(true);
    expect(result.artifact).toEqual({ fallbackData: true });
  });
});
