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
  streamInput,
  streamLimitReached,
  validationFail,
  validationPass,
} from "./transitions.ts";

describe("Transition error paths - invalid stage index", () => {
  it("streamInput rejects currentStage=0", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 0;
    expect(streamInput(run, 20).ok).toBe(false);
  });

  it("completeStreaming rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(completeStreaming(run).ok).toBe(false);
  });

  it("abandonStreaming rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(abandonStreaming(run).ok).toBe(false);
  });

  it("streamLimitReached rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(streamLimitReached(run, 20).ok).toBe(false);
  });

  it("beginNonStreamingStage rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(beginNonStreamingStage(run).ok).toBe(false);
  });

  it("completePairRouting rejects non-pair stage index", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(completePairRouting(run).ok).toBe(false);
  });

  it("finishExecution rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(finishExecution(run).ok).toBe(false);
  });

  it("validationPass rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(validationPass(run, {}).ok).toBe(false);
  });

  it("validationFail rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(validationFail(run).ok).toBe(false);
  });

  it("retryAfterValidationFail rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(retryAfterValidationFail(run, 3).ok).toBe(false);
  });

  it("retryExhausted rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(retryExhausted(run, 3).ok).toBe(false);
  });

  it("retryToExecuting rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(retryToExecuting(run).ok).toBe(false);
  });

  it("claudeApiFail rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(claudeApiFail(run, "claude_api_timeout", 3).ok).toBe(false);
  });

  it("claudeApiFailExhausted rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(claudeApiFailExhausted(run, 3).ok).toBe(false);
  });

  it("acquireGit rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(acquireGit(run, "r").ok).toBe(false);
  });

  it("gitSuccess rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(gitSuccess(run, {}).ok).toBe(false);
  });

  it("gitFail rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(gitFail(run).ok).toBe(false);
  });

  it("gitRetry rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(gitRetry(run, 3).ok).toBe(false);
  });

  it("gitRetryExhausted rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(gitRetryExhausted(run, 3).ok).toBe(false);
  });

  it("advanceStage rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(advanceStage(run).ok).toBe(false);
  });

  it("beginCompensation rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(beginCompensation(run).ok).toBe(false);
  });

  it("failRunNoCheckpoint rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(failRunNoCheckpoint(run).ok).toBe(false);
  });

  it("pairRoutingApiFail rejects currentStage=0", () => {
    const run = createRunRecord();
    run.currentStage = 0;
    expect(pairRoutingApiFail(run, 3).ok).toBe(false);
  });
});

function verifyAdvanceAndCompensationGuards() {
  it("advanceStage rejects non-completed", () => {
    const run = createRunRecord();
    run.currentStage = 2;
    run.stages.DebateModerator.status = "executing";
    expect(advanceStage(run).ok).toBe(false);
  });

  it("advanceStage rejects at stage 7", () => {
    const run = createRunRecord();
    run.currentStage = 7;
    run.stages.ForkJoin.status = "completed";
    expect(advanceStage(run).ok).toBe(false);
  });

  it("beginCompensation rejects non-failed stage", () => {
    const run = createRunRecord();
    run.currentStage = 3;
    run.checkpoint = 2;
    run.stages.TlaWriter.status = "executing";
    expect(beginCompensation(run).ok).toBe(false);
  });

  it("failRunNoCheckpoint rejects non-failed stage", () => {
    const run = createRunRecord();
    run.currentStage = 1;
    run.stages.Questioner.status = "executing";
    expect(failRunNoCheckpoint(run).ok).toBe(false);
  });

  it("failRunNoCheckpoint rejects with checkpoint > 0", () => {
    const run = createRunRecord();
    run.currentStage = 2;
    run.checkpoint = 1;
    run.stages.DebateModerator.status = "failed";
    expect(failRunNoCheckpoint(run).ok).toBe(false);
  });

  it("completeCompensation rejects non-compensating", () => {
    const run = createRunRecord();
    run.state = "running";
    expect(completeCompensation(run).ok).toBe(false);
  });

  it("failCompensation rejects non-compensating", () => {
    const run = createRunRecord();
    run.state = "running";
    expect(failCompensation(run).ok).toBe(false);
  });

  it("pairRoutingApiFail rejects non-pair_routing", () => {
    const run = createRunRecord();
    run.currentStage = 6;
    run.stages.PairProgramming.status = "executing";
    expect(pairRoutingApiFail(run, 3).ok).toBe(false);
  });

  it("pairRoutingApiFail rejects at cap", () => {
    const run = createRunRecord();
    run.currentStage = 6;
    run.stages.PairProgramming.status = "pair_routing";
    run.stages.PairProgramming.retries = 3;
    expect(pairRoutingApiFail(run, 3).ok).toBe(false);
  });

  it("completeRun rejects non-completed stage 7", () => {
    const run = createRunRecord();
    run.currentStage = 7;
    run.stages.ForkJoin.status = "executing";
    expect(completeRun(run).ok).toBe(false);
  });
}

function verifyClaudeApiGuards() {
  it("claudeApiFail rejects non-executing", () => {
    const run = createRunRecord();
    run.currentStage = 2;
    run.stages.DebateModerator.status = "pending";
    expect(claudeApiFail(run, "claude_api_timeout", 3).ok).toBe(false);
  });

  it("claudeApiFail rejects at cap", () => {
    const run = createRunRecord();
    run.currentStage = 2;
    run.stages.DebateModerator.status = "executing";
    run.stages.DebateModerator.retries = 3;
    expect(claudeApiFail(run, "claude_api_timeout", 3).ok).toBe(false);
  });

  it("claudeApiFailExhausted rejects non-executing", () => {
    const run = createRunRecord();
    run.currentStage = 2;
    run.stages.DebateModerator.status = "pending";
    expect(claudeApiFailExhausted(run, 3).ok).toBe(false);
  });

  it("claudeApiFailExhausted rejects under cap", () => {
    const run = createRunRecord();
    run.currentStage = 2;
    run.stages.DebateModerator.status = "executing";
    run.stages.DebateModerator.retries = 1;
    expect(claudeApiFailExhausted(run, 3).ok).toBe(false);
  });
}

function verifyGitGuards() {
  it("acquireGit rejects non-git_operating", () => {
    const run = createRunRecord();
    run.currentStage = 6;
    run.stages.PairProgramming.status = "executing";
    expect(acquireGit(run, "r").ok).toBe(false);
  });

  it("gitSuccess rejects non-git_operating", () => {
    const run = createRunRecord();
    run.currentStage = 6;
    run.stages.PairProgramming.status = "executing";
    expect(gitSuccess(run, {}).ok).toBe(false);
  });

  it("gitFail rejects non-git_operating", () => {
    const run = createRunRecord();
    run.currentStage = 6;
    run.stages.PairProgramming.status = "executing";
    expect(gitFail(run).ok).toBe(false);
  });

  it("gitRetry rejects non-git_operating", () => {
    const run = createRunRecord();
    run.currentStage = 6;
    run.stages.PairProgramming.status = "executing";
    expect(gitRetry(run, 3).ok).toBe(false);
  });

  it("gitRetry rejects at cap", () => {
    const run = createRunRecord();
    run.currentStage = 6;
    run.stages.PairProgramming.status = "git_operating";
    run.stages.PairProgramming.retries = 3;
    expect(gitRetry(run, 3).ok).toBe(false);
  });

  it("gitRetryExhausted rejects non-git_operating", () => {
    const run = createRunRecord();
    run.currentStage = 6;
    run.stages.PairProgramming.status = "executing";
    expect(gitRetryExhausted(run, 3).ok).toBe(false);
  });

  it("gitRetryExhausted rejects under cap", () => {
    const run = createRunRecord();
    run.currentStage = 6;
    run.stages.PairProgramming.status = "git_operating";
    run.stages.PairProgramming.retries = 1;
    expect(gitRetryExhausted(run, 3).ok).toBe(false);
  });
}

function verifyRetryGuards() {
  it("retryAfterValidationFail rejects non-validation_failed", () => {
    const run = createRunRecord();
    run.currentStage = 2;
    run.stages.DebateModerator.status = "executing";
    expect(retryAfterValidationFail(run, 3).ok).toBe(false);
  });

  it("retryAfterValidationFail rejects at cap", () => {
    const run = createRunRecord();
    run.currentStage = 2;
    run.stages.DebateModerator.status = "validation_failed";
    run.stages.DebateModerator.retries = 3;
    expect(retryAfterValidationFail(run, 3).ok).toBe(false);
  });

  it("retryExhausted rejects non-validation_failed", () => {
    const run = createRunRecord();
    run.currentStage = 2;
    run.stages.DebateModerator.status = "executing";
    expect(retryExhausted(run, 3).ok).toBe(false);
  });

  it("retryExhausted rejects under cap", () => {
    const run = createRunRecord();
    run.currentStage = 2;
    run.stages.DebateModerator.status = "validation_failed";
    run.stages.DebateModerator.retries = 1;
    expect(retryExhausted(run, 3).ok).toBe(false);
  });

  it("retryToExecuting rejects non-retrying", () => {
    const run = createRunRecord();
    run.currentStage = 2;
    run.stages.DebateModerator.status = "executing";
    expect(retryToExecuting(run).ok).toBe(false);
  });
}

function verifyStageStatusGuards() {
  it("beginNonStreamingStage rejects non-pending status", () => {
    const run = createRunRecord();
    run.currentStage = 2;
    run.stages.DebateModerator.status = "executing";
    expect(beginNonStreamingStage(run).ok).toBe(false);
  });

  it("completePairRouting rejects non-pair_routing status", () => {
    const run = createRunRecord();
    run.currentStage = 6;
    run.stages.PairProgramming.status = "executing";
    expect(completePairRouting(run).ok).toBe(false);
  });

  it("finishExecution rejects non-executing status", () => {
    const run = createRunRecord();
    run.currentStage = 2;
    run.stages.DebateModerator.status = "pending";
    expect(finishExecution(run).ok).toBe(false);
  });

  it("validationPass rejects non-validating", () => {
    const run = createRunRecord();
    run.currentStage = 2;
    run.stages.DebateModerator.status = "executing";
    expect(validationPass(run, {}).ok).toBe(false);
  });

  it("validationFail rejects non-validating", () => {
    const run = createRunRecord();
    run.currentStage = 2;
    run.stages.DebateModerator.status = "executing";
    expect(validationFail(run).ok).toBe(false);
  });
}

function verifyStreamInputWrongStatus() {
  it("streamInput rejects non-streaming_input status on streaming stage", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 5;
    run.stages.ImplementationPlanning.status = "executing";
    expect(streamInput(run, 20).ok).toBe(false);
  });

  it("completeStreaming rejects non-streaming_input on streaming stage", () => {
    const run = createRunRecord();
    run.currentStage = 5;
    run.stages.ImplementationPlanning.status = "executing";
    expect(completeStreaming(run).ok).toBe(false);
  });

  it("abandonStreaming rejects non-streaming_input", () => {
    const run = createRunRecord();
    run.currentStage = 1;
    run.stages.Questioner.status = "executing";
    expect(abandonStreaming(run).ok).toBe(false);
  });

  it("streamLimitReached rejects non-streaming_input", () => {
    const run = createRunRecord();
    run.currentStage = 1;
    run.stages.Questioner.status = "executing";
    expect(streamLimitReached(run, 20).ok).toBe(false);
  });

  it("streamLimitReached rejects turns below max", () => {
    const run = createRunRecord();
    run.state = "running";
    run.currentStage = 1;
    run.stages.Questioner.status = "streaming_input";
    run.stages.Questioner.turns = 5;
    expect(streamLimitReached(run, 20).ok).toBe(false);
  });
}

describe("Transition error paths - wrong status", () => {
  verifyStreamInputWrongStatus();
  verifyStageStatusGuards();
  verifyRetryGuards();
  verifyClaudeApiGuards();
  verifyGitGuards();
  verifyAdvanceAndCompensationGuards();
});
