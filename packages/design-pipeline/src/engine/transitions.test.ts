import { describe, expect, it } from "vitest";

import { createRunRecord } from "../types/run.ts";
import {
  abandonStreaming,
  acquireGit,
  advanceStage,
  beginCompensation,
  beginNonStreamingStage,
  claudeApiFail,
  claudeApiFailExhausted,
  completeCompensation,
  completePairRouting,
  completeRun,
  completeStreaming,
  failCompensation,
  failRunNoCheckpoint,
  finishExecution,
  gitFail,
  gitRetry,
  gitRetryExhausted,
  gitSuccess,
  pairRoutingApiFail,
  retryAfterValidationFail,
  retryExhausted,
  retryToExecuting,
  startRun,
  streamInput,
  streamLimitReached,
  validationFail,
  validationPass,
} from "./transitions.ts";

describe("startRun", () => {
  it("idle -> running, stage 1 streaming_input", () => {
    const run = createRunRecord();
    const result = startRun(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.state).toBe("running");
      expect(result.value.currentStage).toBe(1);
      expect(result.value.stages.Questioner.status).toBe("streaming_input");
    }
  });

  it("rejects if not idle", () => {
    const run = createRunRecord();
    run.state = "running";
    const result = startRun(run);
    expect(result.ok).toBe(false);
  });
});

describe("streamInput", () => {
  it("increments turns", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 1;
    run.stages.Questioner.status = "streaming_input";
    const result = streamInput(run, 20);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.Questioner.turns).toBe(1);
    }
  });

  it("rejects if not streaming stage", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 2;
    run.stages.DebateModerator.status = "streaming_input";
    const result = streamInput(run, 20);
    expect(result.ok).toBe(false);
  });

  it("rejects if not streaming_input status", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 1;
    run.stages.Questioner.status = "executing";
    const result = streamInput(run, 20);
    expect(result.ok).toBe(false);
  });

  it("rejects if turns at max", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 1;
    run.stages.Questioner.status = "streaming_input";
    run.stages.Questioner.turns = 20;
    const result = streamInput(run, 20);
    expect(result.ok).toBe(false);
  });
});

describe("completeStreaming", () => {
  it("streaming_input -> executing", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 1;
    run.stages.Questioner.status = "streaming_input";
    run.stages.Questioner.turns = 1;
    const result = completeStreaming(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.Questioner.status).toBe("executing");
    }
  });

  it("rejects if turns < 1", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 1;
    run.stages.Questioner.status = "streaming_input";
    run.stages.Questioner.turns = 0;
    const result = completeStreaming(run);
    expect(result.ok).toBe(false);
  });
});

describe("abandonStreaming", () => {
  it("streaming_input -> failed with user_abandon", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 1;
    run.stages.Questioner.status = "streaming_input";
    const result = abandonStreaming(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.Questioner.status).toBe("failed");
      expect(result.value.stages.Questioner.error).toBe("user_abandon");
    }
  });
});

describe("streamLimitReached", () => {
  it("turns = MaxStreamTurns -> failed with stream_limit_exceeded (Gap 3)", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 1;
    run.stages.Questioner.status = "streaming_input";
    run.stages.Questioner.turns = 20;
    const result = streamLimitReached(run, 20);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.Questioner.status).toBe("failed");
      expect(result.value.stages.Questioner.error).toBe(
        "stream_limit_exceeded",
      );
    }
  });
});

describe("beginNonStreamingStage", () => {
  it("pending -> executing for non-streaming, non-pair stage", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 2;
    run.stages.DebateModerator.status = "pending";
    const result = beginNonStreamingStage(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.DebateModerator.status).toBe("executing");
    }
  });

  it("pending -> pair_routing for PairProgramming", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 6;
    run.stages.PairProgramming.status = "pending";
    const result = beginNonStreamingStage(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.PairProgramming.status).toBe("pair_routing");
    }
  });

  it("rejects if streaming stage", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 1;
    run.stages.Questioner.status = "pending";
    const result = beginNonStreamingStage(run);
    expect(result.ok).toBe(false);
  });
});

describe("completePairRouting", () => {
  it("pair_routing -> executing", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 6;
    run.stages.PairProgramming.status = "pair_routing";
    const result = completePairRouting(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.PairProgramming.status).toBe("executing");
    }
  });

  it("rejects if not pair stage", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 2;
    run.stages.DebateModerator.status = "pair_routing";
    const result = completePairRouting(run);
    expect(result.ok).toBe(false);
  });
});

describe("finishExecution", () => {
  it("executing -> validating", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 2;
    run.stages.DebateModerator.status = "executing";
    const result = finishExecution(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.DebateModerator.status).toBe("validating");
    }
  });
});

describe("validationPass", () => {
  it("validating -> completed for non-git stage", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 2;
    run.stages.DebateModerator.status = "validating";
    const result = validationPass(run, { result: "data" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.DebateModerator.status).toBe("completed");
      expect(result.value.stages.DebateModerator.artifact).toEqual({
        result: "data",
      });
    }
  });

  it("validating -> git_operating for git stage", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 6;
    run.stages.PairProgramming.status = "validating";
    const result = validationPass(run, { result: "data" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.PairProgramming.status).toBe("git_operating");
    }
  });
});

describe("validationFail", () => {
  it("validating -> validation_failed with zod_validation", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 2;
    run.stages.DebateModerator.status = "validating";
    const result = validationFail(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.DebateModerator.status).toBe(
        "validation_failed",
      );
      expect(result.value.stages.DebateModerator.error).toBe("zod_validation");
    }
  });
});

describe("retryAfterValidationFail", () => {
  it("validation_failed -> retrying (under cap), increments retries", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 2;
    run.stages.DebateModerator.status = "validation_failed";
    run.stages.DebateModerator.retries = 0;
    const result = retryAfterValidationFail(run, 3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.DebateModerator.status).toBe("retrying");
      expect(result.value.stages.DebateModerator.retries).toBe(1);
    }
  });
});

describe("retryExhausted", () => {
  it("validation_failed -> failed with retry_exhausted (at cap)", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 2;
    run.stages.DebateModerator.status = "validation_failed";
    run.stages.DebateModerator.retries = 3;
    const result = retryExhausted(run, 3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.DebateModerator.status).toBe("failed");
      expect(result.value.stages.DebateModerator.error).toBe("retry_exhausted");
    }
  });
});

describe("retryToExecuting", () => {
  it("retrying -> executing", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 2;
    run.stages.DebateModerator.status = "retrying";
    const result = retryToExecuting(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.DebateModerator.status).toBe("executing");
    }
  });
});

describe("claudeApiFail", () => {
  it("executing -> retrying (under cap)", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 2;
    run.stages.DebateModerator.status = "executing";
    run.stages.DebateModerator.retries = 0;
    const result = claudeApiFail(run, "claude_api_timeout", 3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.DebateModerator.status).toBe("retrying");
      expect(result.value.stages.DebateModerator.error).toBe(
        "claude_api_timeout",
      );
      expect(result.value.stages.DebateModerator.retries).toBe(1);
    }
  });
});

describe("claudeApiFailExhausted", () => {
  it("executing -> failed with retry_exhausted (at cap)", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 2;
    run.stages.DebateModerator.status = "executing";
    run.stages.DebateModerator.retries = 3;
    const result = claudeApiFailExhausted(run, 3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.DebateModerator.status).toBe("failed");
      expect(result.value.stages.DebateModerator.error).toBe("retry_exhausted");
    }
  });
});

describe("acquireGit", () => {
  it("sets gitOwner when no lock held", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 6;
    run.stages.PairProgramming.status = "git_operating";
    const result = acquireGit(run, "run-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.gitOwner).toBe("run-1");
    }
  });

  it("rejects if lock held by another", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 6;
    run.stages.PairProgramming.status = "git_operating";
    const result = acquireGit(run, "run-2", "run-1");
    expect(result.ok).toBe(false);
  });
});

describe("gitSuccess", () => {
  it("git_operating -> completed, release lock, set artifact", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 6;
    run.stages.PairProgramming.status = "git_operating";
    const result = gitSuccess(run, { branch: "test" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.PairProgramming.status).toBe("completed");
      expect(result.value.stages.PairProgramming.artifact).toEqual({
        branch: "test",
      });
      expect(result.value.gitOwner).toBeUndefined();
    }
  });
});

describe("gitFail", () => {
  it("git_operating -> failed with git_failure, release lock", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 6;
    run.stages.PairProgramming.status = "git_operating";
    const result = gitFail(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.PairProgramming.status).toBe("failed");
      expect(result.value.stages.PairProgramming.error).toBe("git_failure");
      expect(result.value.gitOwner).toBeUndefined();
    }
  });
});

describe("gitRetry (Gap 1)", () => {
  it("git_operating failed -> retrying", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 6;
    run.stages.PairProgramming.status = "git_operating";
    run.stages.PairProgramming.retries = 0;
    const result = gitRetry(run, 3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.PairProgramming.status).toBe("retrying");
      expect(result.value.stages.PairProgramming.retries).toBe(1);
      expect(result.value.stages.PairProgramming.error).toBe("git_failure");
      expect(result.value.gitOwner).toBeUndefined();
    }
  });
});

describe("gitRetryExhausted (Gap 1)", () => {
  it("git retry cap hit -> failed", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 6;
    run.stages.PairProgramming.status = "git_operating";
    run.stages.PairProgramming.retries = 3;
    const result = gitRetryExhausted(run, 3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.PairProgramming.status).toBe("failed");
      expect(result.value.stages.PairProgramming.error).toBe(
        "git_retry_exhausted",
      );
    }
  });
});

describe("advanceStage", () => {
  it("completed -> next stage. Streaming stages get streaming_input", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 4;
    run.stages.ExpertReview.status = "completed";
    const result = advanceStage(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Stage 5 is ImplementationPlanning (streaming)
      expect(result.value.currentStage).toBe(5);
      expect(result.value.stages.ImplementationPlanning.status).toBe(
        "streaming_input",
      );
      expect(result.value.checkpoint).toBe(4);
    }
  });

  it("non-streaming stages get pending", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 1;
    run.stages.Questioner.status = "completed";
    const result = advanceStage(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Stage 2 is DebateModerator (non-streaming)
      expect(result.value.currentStage).toBe(2);
      expect(result.value.stages.DebateModerator.status).toBe("pending");
      expect(result.value.checkpoint).toBe(1);
    }
  });
});

describe("completeRun", () => {
  it("stage 7 completed -> run completed", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 7;
    run.stages.ForkJoin.status = "completed";
    const result = completeRun(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.state).toBe("completed");
    }
  });

  it("rejects if not stage 7", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 6;
    run.stages.PairProgramming.status = "completed";
    const result = completeRun(run);
    expect(result.ok).toBe(false);
  });
});

describe("beginCompensation", () => {
  it("stage failed + checkpoint > 0 -> run compensating", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 3;
    run.checkpoint = 2;
    run.stages.TlaWriter.status = "failed";
    const result = beginCompensation(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.state).toBe("compensating");
    }
  });

  it("rejects if checkpoint = 0", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 1;
    run.checkpoint = 0;
    run.stages.Questioner.status = "failed";
    const result = beginCompensation(run);
    expect(result.ok).toBe(false);
  });
});

describe("failRunNoCheckpoint", () => {
  it("stage failed + checkpoint = 0 -> run failed", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 1;
    run.checkpoint = 0;
    run.stages.Questioner.status = "failed";
    const result = failRunNoCheckpoint(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.state).toBe("failed");
    }
  });
});

describe("completeCompensation", () => {
  it("compensating -> compensated stages, run failed", () => {
    const run = createRunRecord();
    run.state = "compensating";
    run.currentStage = 3;
    run.checkpoint = 2;
    run.stages.Questioner.status = "completed";
    run.stages.DebateModerator.status = "completed";
    const result = completeCompensation(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.state).toBe("failed");
      expect(result.value.stages.Questioner.status).toBe("compensated");
      expect(result.value.stages.DebateModerator.status).toBe("compensated");
    }
  });
});

describe("failCompensation (Gap 2)", () => {
  it("compensation fails -> compensation_failed", () => {
    const run = createRunRecord();
    run.state = "compensating";
    run.currentStage = 3;
    run.stages.Questioner.status = "compensating";
    const result = failCompensation(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.Questioner.status).toBe("compensation_failed");
      expect(result.value.state).toBe("failed");
    }
  });
});

describe("pairRoutingApiFail (Gap 7)", () => {
  it("pair_routing -> retrying on API failure", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 6;
    run.stages.PairProgramming.status = "pair_routing";
    run.stages.PairProgramming.retries = 0;
    const result = pairRoutingApiFail(run, 3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stages.PairProgramming.status).toBe("retrying");
      expect(result.value.stages.PairProgramming.error).toBe(
        "pair_routing_api_failed",
      );
      expect(result.value.stages.PairProgramming.retries).toBe(1);
    }
  });
});

describe("completeCompensation - non-completed stage branch", () => {
  it("skips stages that are not completed within checkpoint range", () => {
    const run = createRunRecord();
    run.state = "compensating";
    run.currentStage = 3;
    run.checkpoint = 2;
    // Stage 1 (Questioner) is completed, stage 2 (DebateModerator) is NOT completed
    run.stages.Questioner.status = "completed";
    run.stages.DebateModerator.status = "failed";
    const result = completeCompensation(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.state).toBe("failed");
      // Questioner was completed -> compensated
      expect(result.value.stages.Questioner.status).toBe("compensated");
      // DebateModerator was failed -> stays failed (not compensated)
      expect(result.value.stages.DebateModerator.status).toBe("failed");
    }
  });
});

describe("advanceStage - nextStageName falsy branch", () => {
  it("handles advancing when next stage name is undefined", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 6;
    run.stages.PairProgramming.status = "completed";
    const result = advanceStage(run);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.currentStage).toBe(7);
      expect(result.value.stages.ForkJoin.status).toBe("pending");
    }
  });

  it("returns error when currentStage is out of range (0)", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 0;
    const result = advanceStage(run);
    expect(result.ok).toBe(false);
  });

  it("returns error when currentStage is out of range (negative)", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = -1;
    const result = advanceStage(run);
    expect(result.ok).toBe(false);
  });
});
