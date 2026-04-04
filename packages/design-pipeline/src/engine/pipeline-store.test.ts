import { describe, expect, it } from "vitest";

import type { PipelineState } from "./pipeline-store.ts";

import { TestPipelineStore } from "./test-store.ts";

const STAGE_QUESTIONER = "Questioner";
const STAGE_DEBATE = "DebateModerator";
const STAGE_TLA = "TlaWriter";
const STAGE_IMPL = "ImplementationPlanning";
const STAGE_PAIR = "PairProgramming";
const STAGE_FORK = "ForkJoin";
const RUN_ID = "run-1";
const RUN_ID_2 = "run-2";

const STATUS_STREAMING = "streaming_input";
const STATUS_EXECUTING = "executing";
const STATUS_PENDING = "pending";
const STATUS_FAILED = "failed";
const STATUS_GIT_OP = "git_operating";
const STATUS_PAIR_ROUTE = "pair_routing";
const STATUS_VAL_FAILED = "validation_failed";
const STATUS_VALIDATING = "validating";
const STATUS_COMPLETED = "completed";
const STATUS_COMPENSATING = "compensating";

const IT_STAGE_0 = "fails when currentStage is 0";
const IT_NOT_STREAMING = "fails on non-streaming stage";
const IT_NOT_GIT_OP = "fails when stage not git_operating";
const IT_NOT_EXECUTING = "fails when stage not executing";
const IT_RETRIES_AT_CAP = "fails when retries at cap";
const IT_RETRIES_NOT_CAP = "fails when retries not at cap";
const IT_NOT_STREAMING_INPUT = "fails when not in streaming_input";

type DraftUpdater = (draft: PipelineState) => void;

function setRetries(
  stageName: keyof PipelineState["stages"],
  count: number,
): DraftUpdater {
  return (draft) => {
    draft.stages[stageName].retries = count;
  };
}

function setTurns(
  stageName: keyof PipelineState["stages"],
  count: number,
): DraftUpdater {
  return (draft) => {
    draft.stages[stageName].turns = count;
  };
}

function storeAt(
  stage: number,
  stageName: string,
  status: string,
  extra?: DraftUpdater,
) {
  const store = new TestPipelineStore();
  store.forceState((draft) => {
    draft.state = "running";
    draft.currentStage = stage;
    const s = draft.stages as Record<string, { status: string } | undefined>;
    const record = s[stageName];
    if (record) {
      record.status = status;
    }
    extra?.(draft);
  });
  return store;
}

// ── lifecycle ──────────────────────────────────────────────────────
describe("PipelineStore – lifecycle", () => {
  describe("abandonStreaming", () => {
    it("succeeds from streaming_input on a streaming stage", () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_STREAMING);
      const result = store.abandonStreaming();
      expect(result.ok).toBe(true);
      expect(store.state.stages.Questioner.status).toBe(STATUS_FAILED);
      expect(store.state.stages.Questioner.error).toBe("user_abandon");
    });

    it(IT_NOT_STREAMING, () => {
      const store = storeAt(3, STAGE_TLA, STATUS_STREAMING);
      expect(store.abandonStreaming().ok).toBe(false);
    });

    it("fails when stage not in streaming_input", () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_EXECUTING);
      expect(store.abandonStreaming().ok).toBe(false);
    });

    it(`${IT_STAGE_0} (no stage)`, () => {
      expect(new TestPipelineStore().abandonStreaming().ok).toBe(false);
    });
  });

  describe("acquireGit", () => {
    it("succeeds when git_operating and no owner", () => {
      const store = storeAt(6, STAGE_PAIR, STATUS_GIT_OP);
      expect(store.acquireGit(RUN_ID).ok).toBe(true);
      expect(store.state.gitOwner).toBe(RUN_ID);
    });

    it("succeeds when same owner re-acquires", () => {
      const store = storeAt(6, STAGE_PAIR, STATUS_GIT_OP, (d) => {
        d.gitOwner = RUN_ID;
      });
      expect(store.acquireGit(RUN_ID).ok).toBe(true);
    });

    it("fails when another owner holds lock", () => {
      const store = storeAt(6, STAGE_PAIR, STATUS_GIT_OP, (d) => {
        d.gitOwner = RUN_ID;
      });
      expect(store.acquireGit(RUN_ID_2).ok).toBe(false);
    });

    it(IT_NOT_GIT_OP, () => {
      const store = storeAt(6, STAGE_PAIR, STATUS_EXECUTING);
      expect(store.acquireGit(RUN_ID).ok).toBe(false);
    });

    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().acquireGit(RUN_ID).ok).toBe(false);
    });
  });

  describe("advanceStage", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().advanceStage().ok).toBe(false);
    });

    it("fails when current stage not completed", () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_EXECUTING);
      expect(store.advanceStage().ok).toBe(false);
    });

    it("fails when already at last stage", () => {
      const store = storeAt(7, STAGE_FORK, STATUS_COMPLETED);
      expect(store.advanceStage().ok).toBe(false);
    });

    it("advances and sets streaming_input for streaming stage", () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_COMPLETED);
      expect(store.advanceStage().ok).toBe(true);
      expect(store.state.currentStage).toBe(2);
    });

    it("advances and sets pending for non-streaming stage", () => {
      const store = storeAt(2, STAGE_DEBATE, STATUS_COMPLETED);
      expect(store.advanceStage().ok).toBe(true);
      expect(store.state.stages.TlaWriter.status).toBe(STATUS_PENDING);
    });
  });

  describe("startRun", () => {
    it("fails when state is not idle", () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_STREAMING);
      expect(store.startRun().ok).toBe(false);
    });
  });
});

// ── compensation ───────────────────────────────────────────────────
describe("PipelineStore – compensation", () => {
  describe("beginCompensation", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().beginCompensation().ok).toBe(false);
    });

    it("fails when current stage not failed", () => {
      const store = storeAt(2, STAGE_DEBATE, STATUS_EXECUTING);
      expect(store.beginCompensation().ok).toBe(false);
    });

    it("fails when checkpoint is 0", () => {
      const store = storeAt(2, STAGE_DEBATE, STATUS_FAILED);
      expect(store.beginCompensation().ok).toBe(false);
    });

    it("succeeds with valid checkpoint", () => {
      const store = storeAt(2, STAGE_DEBATE, STATUS_FAILED, (d) => {
        d.checkpoint = 1;
      });
      expect(store.beginCompensation().ok).toBe(true);
      expect(store.state.state).toBe(STATUS_COMPENSATING);
    });
  });

  describe("completeCompensation", () => {
    it("fails when not compensating", () => {
      const store = storeAt(2, STAGE_DEBATE, STATUS_FAILED);
      expect(store.completeCompensation().ok).toBe(false);
    });

    it("marks completed stages as compensated", () => {
      const store = new TestPipelineStore();
      store.forceState((d) => {
        d.state = STATUS_COMPENSATING;
        d.currentStage = 3;
        d.checkpoint = 2;
        d.stages.Questioner.status = STATUS_COMPLETED;
        d.stages.DebateModerator.status = STATUS_COMPLETED;
      });
      expect(store.completeCompensation().ok).toBe(true);
      expect(store.state.stages.Questioner.status).toBe("compensated");
      expect(store.state.stages.DebateModerator.status).toBe("compensated");
      expect(store.state.state).toBe(STATUS_FAILED);
    });

    it("skips non-completed stages during compensation", () => {
      const store = new TestPipelineStore();
      store.forceState((d) => {
        d.state = STATUS_COMPENSATING;
        d.currentStage = 3;
        d.checkpoint = 2;
        d.stages.Questioner.status = STATUS_COMPLETED;
        d.stages.DebateModerator.status = STATUS_FAILED;
      });
      expect(store.completeCompensation().ok).toBe(true);
      expect(store.state.stages.Questioner.status).toBe("compensated");
      expect(store.state.stages.DebateModerator.status).toBe(STATUS_FAILED);
    });
  });

  describe("failCompensation", () => {
    it("fails when not compensating", () => {
      const store = storeAt(2, STAGE_DEBATE, STATUS_FAILED);
      expect(store.failCompensation().ok).toBe(false);
    });

    it("marks compensating stages as compensation_failed", () => {
      const store = new TestPipelineStore();
      store.forceState((d) => {
        d.state = STATUS_COMPENSATING;
        d.currentStage = 2;
        d.stages.Questioner.status = STATUS_COMPENSATING;
      });
      expect(store.failCompensation().ok).toBe(true);
      expect(store.state.stages.Questioner.status).toBe("compensation_failed");
      expect(store.state.state).toBe(STATUS_FAILED);
    });
  });

  describe("failCurrentStage", () => {
    it("does nothing when currentStage is 0", () => {
      const store = new TestPipelineStore();
      store.failCurrentStage("claude_api_timeout");
      expect(store.state.stages.Questioner.status).toBe(STATUS_PENDING);
    });
  });

  describe("failRunNoCheckpoint", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().failRunNoCheckpoint().ok).toBe(false);
    });

    it("fails when current stage not failed", () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_EXECUTING);
      expect(store.failRunNoCheckpoint().ok).toBe(false);
    });

    it("fails when checkpoint exists", () => {
      const store = storeAt(2, STAGE_DEBATE, STATUS_FAILED, (d) => {
        d.checkpoint = 1;
      });
      expect(store.failRunNoCheckpoint().ok).toBe(false);
    });

    it("succeeds with no checkpoint", () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_FAILED);
      expect(store.failRunNoCheckpoint().ok).toBe(true);
      expect(store.state.state).toBe(STATUS_FAILED);
    });
  });
});

// ── stage transitions ──────────────────────────────────────────────
describe("PipelineStore – stage transitions", () => {
  describe("beginNonStreamingStage", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().beginNonStreamingStage().ok).toBe(false);
    });

    it("fails on streaming stage", () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_PENDING);
      expect(store.beginNonStreamingStage().ok).toBe(false);
    });

    it("fails when stage not pending", () => {
      const store = storeAt(3, STAGE_TLA, STATUS_EXECUTING);
      expect(store.beginNonStreamingStage().ok).toBe(false);
    });

    it("sets pair_routing for PairProgramming stage", () => {
      const store = storeAt(6, STAGE_PAIR, STATUS_PENDING);
      expect(store.beginNonStreamingStage().ok).toBe(true);
      expect(store.state.stages.PairProgramming.status).toBe(STATUS_PAIR_ROUTE);
    });

    it("sets executing for non-pair stage", () => {
      const store = storeAt(3, STAGE_TLA, STATUS_PENDING);
      expect(store.beginNonStreamingStage().ok).toBe(true);
      expect(store.state.stages.TlaWriter.status).toBe(STATUS_EXECUTING);
    });
  });

  describe("claudeApiFail", () => {
    it(IT_STAGE_0, () => {
      expect(
        new TestPipelineStore().claudeApiFail("claude_api_timeout", 3).ok,
      ).toBe(false);
    });

    it(IT_NOT_EXECUTING, () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_PENDING);
      expect(store.claudeApiFail("claude_api_timeout", 3).ok).toBe(false);
    });

    it(IT_RETRIES_AT_CAP, () => {
      const store = storeAt(
        1,
        STAGE_QUESTIONER,
        STATUS_EXECUTING,
        setRetries("Questioner", 3),
      );
      expect(store.claudeApiFail("claude_api_timeout", 3).ok).toBe(false);
    });
  });

  describe("claudeApiFailExhausted", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().claudeApiFailExhausted(3).ok).toBe(false);
    });

    it(IT_NOT_EXECUTING, () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_PENDING);
      expect(store.claudeApiFailExhausted(3).ok).toBe(false);
    });

    it(IT_RETRIES_NOT_CAP, () => {
      const store = storeAt(
        1,
        STAGE_QUESTIONER,
        STATUS_EXECUTING,
        setRetries("Questioner", 1),
      );
      expect(store.claudeApiFailExhausted(3).ok).toBe(false);
    });
  });

  describe("completePairRouting", () => {
    it("fails on non-pair stage", () => {
      const store = storeAt(3, STAGE_TLA, STATUS_PAIR_ROUTE);
      expect(store.completePairRouting().ok).toBe(false);
    });

    it("fails when not in pair_routing", () => {
      const store = storeAt(6, STAGE_PAIR, STATUS_EXECUTING);
      expect(store.completePairRouting().ok).toBe(false);
    });
  });

  describe("completeRun", () => {
    it("fails when not at stage 7", () => {
      const store = storeAt(5, STAGE_IMPL, STATUS_COMPLETED);
      expect(store.completeRun().ok).toBe(false);
    });

    it("fails when ForkJoin not completed", () => {
      const store = storeAt(7, STAGE_FORK, STATUS_EXECUTING);
      expect(store.completeRun().ok).toBe(false);
    });
  });

  describe("completeStreaming", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().completeStreaming().ok).toBe(false);
    });

    it(IT_NOT_STREAMING, () => {
      const store = storeAt(3, STAGE_TLA, STATUS_STREAMING);
      expect(store.completeStreaming().ok).toBe(false);
    });

    it(IT_NOT_STREAMING_INPUT, () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_EXECUTING);
      expect(store.completeStreaming().ok).toBe(false);
    });

    it("fails when turns is 0", () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_STREAMING);
      expect(store.completeStreaming().ok).toBe(false);
    });

    it("succeeds with at least 1 turn", () => {
      const store = storeAt(
        1,
        STAGE_QUESTIONER,
        STATUS_STREAMING,
        setTurns("Questioner", 1),
      );
      expect(store.completeStreaming().ok).toBe(true);
      expect(store.state.stages.Questioner.status).toBe(STATUS_EXECUTING);
    });
  });

  describe("finishExecution", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().finishExecution().ok).toBe(false);
    });

    it(IT_NOT_EXECUTING, () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_PENDING);
      expect(store.finishExecution().ok).toBe(false);
    });
  });
});

// ── git operations ─────────────────────────────────────────────────
describe("PipelineStore – git operations", () => {
  describe("gitFail", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().gitFail().ok).toBe(false);
    });

    it(IT_NOT_GIT_OP, () => {
      const store = storeAt(6, STAGE_PAIR, STATUS_EXECUTING);
      expect(store.gitFail().ok).toBe(false);
    });
  });

  describe("gitRetry", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().gitRetry(3).ok).toBe(false);
    });

    it(IT_NOT_GIT_OP, () => {
      const store = storeAt(6, STAGE_PAIR, STATUS_EXECUTING);
      expect(store.gitRetry(3).ok).toBe(false);
    });

    it(IT_RETRIES_AT_CAP, () => {
      const store = storeAt(
        6,
        STAGE_PAIR,
        STATUS_GIT_OP,
        setRetries("PairProgramming", 3),
      );
      expect(store.gitRetry(3).ok).toBe(false);
    });
  });

  describe("gitRetryExhausted", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().gitRetryExhausted(3).ok).toBe(false);
    });

    it(IT_NOT_GIT_OP, () => {
      const store = storeAt(6, STAGE_PAIR, STATUS_EXECUTING);
      expect(store.gitRetryExhausted(3).ok).toBe(false);
    });

    it(IT_RETRIES_NOT_CAP, () => {
      const store = storeAt(
        6,
        STAGE_PAIR,
        STATUS_GIT_OP,
        setRetries("PairProgramming", 1),
      );
      expect(store.gitRetryExhausted(3).ok).toBe(false);
    });
  });

  describe("gitSuccess", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().gitSuccess().ok).toBe(false);
    });

    it(IT_NOT_GIT_OP, () => {
      const store = storeAt(6, STAGE_PAIR, STATUS_EXECUTING);
      expect(store.gitSuccess().ok).toBe(false);
    });
  });
});

// ── pair routing ───────────────────────────────────────────────────
describe("PipelineStore – pair routing", () => {
  describe("pairRoutingApiFail", () => {
    it("fails on non-pair stage", () => {
      const store = storeAt(3, STAGE_TLA, STATUS_PAIR_ROUTE);
      expect(store.pairRoutingApiFail(3).ok).toBe(false);
    });

    it("fails when not in pair_routing", () => {
      const store = storeAt(6, STAGE_PAIR, STATUS_EXECUTING);
      expect(store.pairRoutingApiFail(3).ok).toBe(false);
    });

    it(IT_RETRIES_AT_CAP, () => {
      const store = storeAt(
        6,
        STAGE_PAIR,
        STATUS_PAIR_ROUTE,
        setRetries("PairProgramming", 3),
      );
      expect(store.pairRoutingApiFail(3).ok).toBe(false);
    });
  });
});

// ── retry ──────────────────────────────────────────────────────────
describe("PipelineStore – retry", () => {
  describe("retryAfterValidationFail", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().retryAfterValidationFail(3).ok).toBe(
        false,
      );
    });

    it("fails when stage not validation_failed", () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_EXECUTING);
      expect(store.retryAfterValidationFail(3).ok).toBe(false);
    });

    it(IT_RETRIES_AT_CAP, () => {
      const store = storeAt(
        1,
        STAGE_QUESTIONER,
        STATUS_VAL_FAILED,
        setRetries("Questioner", 3),
      );
      expect(store.retryAfterValidationFail(3).ok).toBe(false);
    });
  });

  describe("retryExhausted", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().retryExhausted(3).ok).toBe(false);
    });

    it("fails when stage not validation_failed", () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_EXECUTING);
      expect(store.retryExhausted(3).ok).toBe(false);
    });

    it(IT_RETRIES_NOT_CAP, () => {
      const store = storeAt(
        1,
        STAGE_QUESTIONER,
        STATUS_VAL_FAILED,
        setRetries("Questioner", 1),
      );
      expect(store.retryExhausted(3).ok).toBe(false);
    });
  });

  describe("retryToExecuting", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().retryToExecuting().ok).toBe(false);
    });

    it("fails when stage not retrying", () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_EXECUTING);
      expect(store.retryToExecuting().ok).toBe(false);
    });
  });
});

// ── streaming ──────────────────────────────────────────────────────
describe("PipelineStore – streaming", () => {
  describe("streamInput", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().streamInput(20).ok).toBe(false);
    });

    it(IT_NOT_STREAMING, () => {
      const store = storeAt(3, STAGE_TLA, STATUS_STREAMING);
      expect(store.streamInput(20).ok).toBe(false);
    });

    it(IT_NOT_STREAMING_INPUT, () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_EXECUTING);
      expect(store.streamInput(20).ok).toBe(false);
    });

    it("fails when turns at max", () => {
      const store = storeAt(
        1,
        STAGE_QUESTIONER,
        STATUS_STREAMING,
        setTurns("Questioner", 20),
      );
      expect(store.streamInput(20).ok).toBe(false);
    });
  });

  describe("streamLimitReached", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().streamLimitReached(20).ok).toBe(false);
    });

    it(IT_NOT_STREAMING, () => {
      const store = storeAt(3, STAGE_TLA, STATUS_STREAMING);
      expect(store.streamLimitReached(20).ok).toBe(false);
    });

    it(IT_NOT_STREAMING_INPUT, () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_EXECUTING);
      expect(store.streamLimitReached(20).ok).toBe(false);
    });

    it("fails when turns not at max", () => {
      const store = storeAt(
        1,
        STAGE_QUESTIONER,
        STATUS_STREAMING,
        setTurns("Questioner", 5),
      );
      expect(store.streamLimitReached(20).ok).toBe(false);
    });
  });
});

// ── validation ─────────────────────────────────────────────────────
describe("PipelineStore – validation", () => {
  describe("validationFail", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().validationFail().ok).toBe(false);
    });

    it("fails when stage not validating", () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_EXECUTING);
      expect(store.validationFail().ok).toBe(false);
    });
  });

  describe("validationPass", () => {
    it(IT_STAGE_0, () => {
      expect(new TestPipelineStore().validationPass().ok).toBe(false);
    });

    it("fails when stage not validating", () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_EXECUTING);
      expect(store.validationPass().ok).toBe(false);
    });

    it("sets git_operating for git stages", () => {
      const store = storeAt(6, STAGE_PAIR, STATUS_VALIDATING);
      expect(store.validationPass({ code: "done" }).ok).toBe(true);
      expect(store.state.stages.PairProgramming.status).toBe(STATUS_GIT_OP);
    });

    it("sets completed for non-git stages", () => {
      const store = storeAt(1, STAGE_QUESTIONER, STATUS_VALIDATING);
      expect(store.validationPass({ summary: "s" }).ok).toBe(true);
      expect(store.state.stages.Questioner.status).toBe(STATUS_COMPLETED);
    });
  });
});
