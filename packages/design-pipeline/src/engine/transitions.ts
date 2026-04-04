import type { ErrorKind } from "../types/errors.ts";
import type { RunRecord } from "../types/run.ts";

import {
  GitStages,
  PairStage,
  type StageName,
  STAGES,
  StreamingStages,
} from "../constants.ts";

const REASON_NOT_STREAMING = "Not a streaming stage";
const REASON_INVALID_STAGE = "Invalid stage index";
const REASON_NOT_EXECUTING = "Stage not executing";
const REASON_NOT_GIT_OPERATING = "Stage not git_operating";
const REASON_RETRIES_AT_CAP = "Retries at cap";
const REASON_RETRIES_NOT_AT_CAP = "Retries not at cap";
const REASON_NOT_STREAMING_INPUT = "Stage not in streaming_input";

type TransitionResult =
  | { ok: false; reason: string }
  | { ok: true; value: { gitOwner?: string } & RunRecord };

export function abandonStreaming(run: RunRecord): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName || !StreamingStages.has(stageName)) {
    return { ok: false, reason: REASON_NOT_STREAMING };
  }
  if ("streaming_input" !== run.stages[stageName].status) {
    return { ok: false, reason: REASON_NOT_STREAMING_INPUT };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "failed";
  next.stages[stageName].error = "user_abandon";
  return { ok: true, value: next };
}

export function acquireGit(
  run: RunRecord,
  owner: string,
  currentGitOwner?: string,
): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("git_operating" !== run.stages[stageName].status) {
    return { ok: false, reason: REASON_NOT_GIT_OPERATING };
  }
  if (currentGitOwner !== undefined && currentGitOwner !== owner) {
    return { ok: false, reason: "Git lock held by another run" };
  }
  const next = cloneRun(run);
  next.gitOwner = owner;
  return { ok: true, value: next };
}

export function advanceStage(run: RunRecord): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("completed" !== run.stages[stageName].status) {
    return { ok: false, reason: "Current stage not completed" };
  }
  if (7 <= run.currentStage) {
    return { ok: false, reason: "Already at last stage" };
  }
  const next = cloneRun(run);
  next.checkpoint = run.currentStage;
  next.currentStage = run.currentStage + 1;
  // currentStage is 1-6 here (guard above blocks >=7), so next is 2-7 and always valid
  const nextStageName = getCurrentStageName(next.currentStage);
  /* v8 ignore next 3 -- currentStage is guarded to 1-6 above, so +1 is always 2-7 (valid) */
  if (!nextStageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  next.stages[nextStageName].status = StreamingStages.has(nextStageName)
    ? "streaming_input"
    : "pending";
  return { ok: true, value: next };
}

export function beginCompensation(run: RunRecord): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("failed" !== run.stages[stageName].status) {
    return { ok: false, reason: "Current stage not failed" };
  }
  if (0 >= run.checkpoint) {
    return { ok: false, reason: "No checkpoint to compensate from" };
  }
  const next = cloneRun(run);
  next.state = "compensating";
  return { ok: true, value: next };
}

export function beginNonStreamingStage(run: RunRecord): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if (StreamingStages.has(stageName)) {
    return {
      ok: false,
      reason: "Streaming stage cannot use beginNonStreamingStage",
    };
  }
  if ("pending" !== run.stages[stageName].status) {
    return { ok: false, reason: "Stage not pending" };
  }
  const next = cloneRun(run);
  next.stages[stageName].status =
    stageName === PairStage ? "pair_routing" : "executing";
  return { ok: true, value: next };
}

export function claudeApiFail(
  run: RunRecord,
  errorKind: ErrorKind,
  maxRetries: number,
): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("executing" !== run.stages[stageName].status) {
    return { ok: false, reason: REASON_NOT_EXECUTING };
  }
  if (run.stages[stageName].retries >= maxRetries) {
    return { ok: false, reason: REASON_RETRIES_AT_CAP };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "retrying";
  next.stages[stageName].error = errorKind;
  next.stages[stageName].retries += 1;
  return { ok: true, value: next };
}

export function claudeApiFailExhausted(
  run: RunRecord,
  maxRetries: number,
): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("executing" !== run.stages[stageName].status) {
    return { ok: false, reason: REASON_NOT_EXECUTING };
  }
  if (run.stages[stageName].retries < maxRetries) {
    return { ok: false, reason: REASON_RETRIES_NOT_AT_CAP };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "failed";
  next.stages[stageName].error = "retry_exhausted";
  return { ok: true, value: next };
}

export function completeCompensation(run: RunRecord): TransitionResult {
  if ("compensating" !== run.state) {
    return { ok: false, reason: "Run not compensating" };
  }
  const next = cloneRun(run);
  // Mark all completed stages up to checkpoint as compensated
  // checkpoint is 1-6 max, so STAGES[0..checkpoint-1] always exist
  for (let index = 0; index < run.checkpoint; index += 1) {
    const name = STAGES[index];
    if (name !== undefined && "completed" === next.stages[name].status) {
      next.stages[name].status = "compensated";
    }
  }
  next.state = "failed";
  return { ok: true, value: next };
}

export function completePairRouting(run: RunRecord): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (stageName !== PairStage) {
    return { ok: false, reason: "Not the pair stage" };
  }
  if ("pair_routing" !== run.stages[stageName].status) {
    return { ok: false, reason: "Stage not in pair_routing" };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "executing";
  return { ok: true, value: next };
}

export function completeRun(run: RunRecord): TransitionResult {
  if (7 !== run.currentStage) {
    return { ok: false, reason: "Not at stage 7" };
  }
  if ("completed" !== run.stages.ForkJoin.status) {
    return { ok: false, reason: "Stage 7 not completed" };
  }
  const next = cloneRun(run);
  next.state = "completed";
  return { ok: true, value: next };
}

export function completeStreaming(run: RunRecord): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName || !StreamingStages.has(stageName)) {
    return { ok: false, reason: REASON_NOT_STREAMING };
  }
  const stage = run.stages[stageName];
  if ("streaming_input" !== stage.status) {
    return { ok: false, reason: REASON_NOT_STREAMING_INPUT };
  }
  if (1 > stage.turns) {
    return { ok: false, reason: "Must have at least 1 turn" };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "executing";
  return { ok: true, value: next };
}

export function failCompensation(run: RunRecord): TransitionResult {
  if ("compensating" !== run.state) {
    return { ok: false, reason: "Run not compensating" };
  }
  const next = cloneRun(run);
  // Mark compensating stages as compensation_failed
  for (const name of STAGES) {
    if ("compensating" === next.stages[name].status) {
      next.stages[name].status = "compensation_failed";
    }
  }
  next.state = "failed";
  return { ok: true, value: next };
}

export function failRunNoCheckpoint(run: RunRecord): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("failed" !== run.stages[stageName].status) {
    return { ok: false, reason: "Current stage not failed" };
  }
  if (0 !== run.checkpoint) {
    return { ok: false, reason: "Checkpoint exists, use compensation" };
  }
  const next = cloneRun(run);
  next.state = "failed";
  return { ok: true, value: next };
}

export function finishExecution(run: RunRecord): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("executing" !== run.stages[stageName].status) {
    return { ok: false, reason: REASON_NOT_EXECUTING };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "validating";
  return { ok: true, value: next };
}

export function gitFail(run: RunRecord): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("git_operating" !== run.stages[stageName].status) {
    return { ok: false, reason: REASON_NOT_GIT_OPERATING };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "failed";
  next.stages[stageName].error = "git_failure";
  delete next.gitOwner;
  return { ok: true, value: next };
}

export function gitRetry(run: RunRecord, maxRetries: number): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("git_operating" !== run.stages[stageName].status) {
    return { ok: false, reason: REASON_NOT_GIT_OPERATING };
  }
  if (run.stages[stageName].retries >= maxRetries) {
    return { ok: false, reason: REASON_RETRIES_AT_CAP };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "retrying";
  next.stages[stageName].error = "git_failure";
  next.stages[stageName].retries += 1;
  delete next.gitOwner;
  return { ok: true, value: next };
}

export function gitRetryExhausted(
  run: RunRecord,
  maxRetries: number,
): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("git_operating" !== run.stages[stageName].status) {
    return { ok: false, reason: REASON_NOT_GIT_OPERATING };
  }
  if (run.stages[stageName].retries < maxRetries) {
    return { ok: false, reason: REASON_RETRIES_NOT_AT_CAP };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "failed";
  next.stages[stageName].error = "git_retry_exhausted";
  delete next.gitOwner;
  return { ok: true, value: next };
}

export function gitSuccess(
  run: RunRecord,
  artifact: unknown,
): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("git_operating" !== run.stages[stageName].status) {
    return { ok: false, reason: REASON_NOT_GIT_OPERATING };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "completed";
  next.stages[stageName].artifact = artifact;
  delete next.gitOwner;
  return { ok: true, value: next };
}

export function pairRoutingApiFail(
  run: RunRecord,
  maxRetries: number,
): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (stageName !== PairStage) {
    return { ok: false, reason: "Not the pair stage" };
  }
  if ("pair_routing" !== run.stages[stageName].status) {
    return { ok: false, reason: "Stage not in pair_routing" };
  }
  if (run.stages[stageName].retries >= maxRetries) {
    return { ok: false, reason: REASON_RETRIES_AT_CAP };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "retrying";
  next.stages[stageName].error = "pair_routing_api_failed";
  next.stages[stageName].retries += 1;
  return { ok: true, value: next };
}

export function retryAfterValidationFail(
  run: RunRecord,
  maxRetries: number,
): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("validation_failed" !== run.stages[stageName].status) {
    return { ok: false, reason: "Stage not validation_failed" };
  }
  if (run.stages[stageName].retries >= maxRetries) {
    return { ok: false, reason: REASON_RETRIES_AT_CAP };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "retrying";
  next.stages[stageName].retries += 1;
  return { ok: true, value: next };
}

export function retryExhausted(
  run: RunRecord,
  maxRetries: number,
): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("validation_failed" !== run.stages[stageName].status) {
    return { ok: false, reason: "Stage not validation_failed" };
  }
  if (run.stages[stageName].retries < maxRetries) {
    return { ok: false, reason: REASON_RETRIES_NOT_AT_CAP };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "failed";
  next.stages[stageName].error = "retry_exhausted";
  return { ok: true, value: next };
}

export function retryToExecuting(run: RunRecord): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("retrying" !== run.stages[stageName].status) {
    return { ok: false, reason: "Stage not retrying" };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "executing";
  return { ok: true, value: next };
}

export function startRun(run: RunRecord): TransitionResult {
  if ("idle" !== run.state) {
    return { ok: false, reason: "Run must be idle to start" };
  }
  const next = cloneRun(run);
  next.state = "running";
  next.currentStage = 1;
  next.stages.Questioner.status = "streaming_input";
  return { ok: true, value: next };
}

export function streamInput(
  run: RunRecord,
  maxStreamTurns: number,
): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName || !StreamingStages.has(stageName)) {
    return { ok: false, reason: REASON_NOT_STREAMING };
  }
  const stage = run.stages[stageName];
  if ("streaming_input" !== stage.status) {
    return { ok: false, reason: REASON_NOT_STREAMING_INPUT };
  }
  if (stage.turns >= maxStreamTurns) {
    return { ok: false, reason: "Turns at max" };
  }
  const next = cloneRun(run);
  next.stages[stageName].turns = stage.turns + 1;
  return { ok: true, value: next };
}

export function streamLimitReached(
  run: RunRecord,
  maxStreamTurns: number,
): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName || !StreamingStages.has(stageName)) {
    return { ok: false, reason: REASON_NOT_STREAMING };
  }
  const stage = run.stages[stageName];
  if ("streaming_input" !== stage.status) {
    return { ok: false, reason: REASON_NOT_STREAMING_INPUT };
  }
  if (stage.turns < maxStreamTurns) {
    return { ok: false, reason: "Turns not at max" };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "failed";
  next.stages[stageName].error = "stream_limit_exceeded";
  return { ok: true, value: next };
}

export function validationFail(run: RunRecord): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("validating" !== run.stages[stageName].status) {
    return { ok: false, reason: "Stage not validating" };
  }
  const next = cloneRun(run);
  next.stages[stageName].status = "validation_failed";
  next.stages[stageName].error = "zod_validation";
  return { ok: true, value: next };
}

export function validationPass(
  run: RunRecord,
  artifact: unknown,
): TransitionResult {
  const stageName = getCurrentStageName(run.currentStage);
  if (!stageName) {
    return { ok: false, reason: REASON_INVALID_STAGE };
  }
  if ("validating" !== run.stages[stageName].status) {
    return { ok: false, reason: "Stage not validating" };
  }
  const next = cloneRun(run);
  next.stages[stageName].artifact = artifact;
  next.stages[stageName].status = GitStages.has(stageName)
    ? "git_operating"
    : "completed";
  return { ok: true, value: next };
}

function cloneRun(run: RunRecord): { gitOwner?: string } & RunRecord {
  return structuredClone(run) as { gitOwner?: string } & RunRecord;
}

function getCurrentStageName(stageIndex: number): StageName | undefined {
  return STAGES[stageIndex - 1];
}
