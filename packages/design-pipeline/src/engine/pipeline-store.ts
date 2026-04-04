import { BaseStore } from "@ethang/store";

import type { ErrorKind } from "../types/errors.ts";
import type { StageMap } from "../types/run.ts";

import {
  GitStages,
  PairStage,
  type StageName,
  STAGES,
  StreamingStages,
} from "../constants.ts";
import {
  createEmptyStageRecord,
  type RunState,
  type StageRecord,
} from "../types/stage.ts";

export type PipelineState = {
  artifacts: Record<string, unknown>;
  checkpoint: number;
  currentStage: number;
  gitOwner: string | undefined;
  stages: StageMap;
  state: RunState;
};

export type TransitionResult = { ok: false; reason: string } | { ok: true };

const REASON_INVALID_STAGE = "Invalid stage index";
const REASON_NOT_EXECUTING = "Stage not executing";
const REASON_NOT_GIT_OPERATING = "Stage not git_operating";
const REASON_NOT_STREAMING = "Not a streaming stage";
const REASON_NOT_STREAMING_INPUT = "Stage not in streaming_input";
const REASON_NOT_VALIDATING = "Stage not validating";
const REASON_NOT_VALIDATION_FAILED = "Stage not validation_failed";
const REASON_RETRIES_AT_CAP = "Retries at cap";
const REASON_RETRIES_NOT_AT_CAP = "Retries not at cap";
const REASON_NOT_COMPENSATING = "Run not compensating";
const REASON_NOT_PAIR_STAGE = "Not the pair stage";
const REASON_NOT_PAIR_ROUTING = "Stage not in pair_routing";
const REASON_CURRENT_NOT_FAILED = "Current stage not failed";

export class PipelineStore extends BaseStore<PipelineState> {
  public get currentStageName(): StageName | undefined {
    return STAGES[this.state.currentStage - 1];
  }

  public constructor() {
    super(createInitialState());
  }

  public abandonStreaming(): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName || !StreamingStages.has(stageName)) {
      return fail(REASON_NOT_STREAMING);
    }
    if ("streaming_input" !== this.state.stages[stageName].status) {
      return fail(REASON_NOT_STREAMING_INPUT);
    }
    this.update((draft) => {
      draft.stages[stageName].status = "failed";
      draft.stages[stageName].error = "user_abandon";
    });
    return ok();
  }

  public acquireGit(owner: string): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("git_operating" !== this.state.stages[stageName].status) {
      return fail(REASON_NOT_GIT_OPERATING);
    }
    if (this.state.gitOwner !== undefined && this.state.gitOwner !== owner) {
      return fail("Git lock held by another run");
    }
    this.update((draft) => {
      draft.gitOwner = owner;
    });
    return ok();
  }

  // ── Run lifecycle ──────────────────────────────────────────────

  public advanceStage(): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("completed" !== this.state.stages[stageName].status) {
      return fail("Current stage not completed");
    }
    if (7 <= this.state.currentStage) {
      return fail("Already at last stage");
    }
    const nextIndex = this.state.currentStage + 1;
    // SAFETY: nextIndex is 2-7 here (currentStage is 1-6 after guards above),
    // so STAGES[nextIndex - 1] is always defined.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const nextStageName = STAGES[nextIndex - 1]!;
    this.update((draft) => {
      draft.checkpoint = draft.currentStage;
      draft.currentStage = nextIndex;
      draft.stages[nextStageName].status = StreamingStages.has(nextStageName)
        ? "streaming_input"
        : "pending";
    });
    return ok();
  }

  public beginCompensation(): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("failed" !== this.state.stages[stageName].status) {
      return fail(REASON_CURRENT_NOT_FAILED);
    }
    if (0 >= this.state.checkpoint) {
      return fail("No checkpoint to compensate from");
    }
    this.update((draft) => {
      draft.state = "compensating";
    });
    return ok();
  }

  // ── Stage advancement ──────────────────────────────────────────

  public beginNonStreamingStage(): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if (StreamingStages.has(stageName)) {
      return fail("Streaming stage cannot use beginNonStreamingStage");
    }
    if ("pending" !== this.state.stages[stageName].status) {
      return fail("Stage not pending");
    }
    this.update((draft) => {
      draft.stages[stageName].status =
        stageName === PairStage ? "pair_routing" : "executing";
    });
    return ok();
  }

  public claudeApiFail(
    errorKind: ErrorKind,
    maxRetries: number,
  ): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("executing" !== this.state.stages[stageName].status) {
      return fail(REASON_NOT_EXECUTING);
    }
    if (this.state.stages[stageName].retries >= maxRetries) {
      return fail(REASON_RETRIES_AT_CAP);
    }
    this.update((draft) => {
      draft.stages[stageName].status = "retrying";
      draft.stages[stageName].error = errorKind;
      draft.stages[stageName].retries += 1;
    });
    return ok();
  }

  // ── Streaming ──────────────────────────────────────────────────

  public claudeApiFailExhausted(maxRetries: number): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("executing" !== this.state.stages[stageName].status) {
      return fail(REASON_NOT_EXECUTING);
    }
    if (this.state.stages[stageName].retries < maxRetries) {
      return fail(REASON_RETRIES_NOT_AT_CAP);
    }
    this.update((draft) => {
      draft.stages[stageName].status = "failed";
      draft.stages[stageName].error = "retry_exhausted";
    });
    return ok();
  }

  public completeCompensation(): TransitionResult {
    if ("compensating" !== this.state.state) {
      return fail(REASON_NOT_COMPENSATING);
    }
    this.update((draft) => {
      for (let index = 0; index < this.state.checkpoint; index += 1) {
        const name = STAGES[index];
        if (name !== undefined && "completed" === draft.stages[name].status) {
          draft.stages[name].status = "compensated";
        }
      }
      draft.state = "failed";
    });
    return ok();
  }

  public completePairRouting(): TransitionResult {
    const stageName = this.currentStageName;
    if (stageName !== PairStage) {
      return fail(REASON_NOT_PAIR_STAGE);
    }
    if ("pair_routing" !== this.state.stages[stageName].status) {
      return fail(REASON_NOT_PAIR_ROUTING);
    }
    this.update((draft) => {
      draft.stages[stageName].status = "executing";
    });
    return ok();
  }

  public completeRun(): TransitionResult {
    if (7 !== this.state.currentStage) {
      return fail("Not at stage 7");
    }
    if ("completed" !== this.state.stages.ForkJoin.status) {
      return fail("Stage 7 not completed");
    }
    this.update((draft) => {
      draft.state = "completed";
    });
    return ok();
  }

  // ── Execution ──────────────────────────────────────────────────

  public completeStreaming(): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName || !StreamingStages.has(stageName)) {
      return fail(REASON_NOT_STREAMING);
    }
    const stage = this.state.stages[stageName];
    if ("streaming_input" !== stage.status) {
      return fail(REASON_NOT_STREAMING_INPUT);
    }
    if (1 > stage.turns) {
      return fail("Must have at least 1 turn");
    }
    this.update((draft) => {
      draft.stages[stageName].status = "executing";
    });
    return ok();
  }

  // ── Validation ─────────────────────────────────────────────────

  public failCompensation(): TransitionResult {
    if ("compensating" !== this.state.state) {
      return fail(REASON_NOT_COMPENSATING);
    }
    this.update((draft) => {
      for (const name of STAGES) {
        if ("compensating" === draft.stages[name].status) {
          draft.stages[name].status = "compensation_failed";
        }
      }
      draft.state = "failed";
    });
    return ok();
  }

  public failCurrentStage(errorKind: ErrorKind): void {
    const stageName = this.currentStageName;
    if (!stageName) {
      return;
    }
    this.update((draft) => {
      draft.stages[stageName].status = "failed";
      draft.stages[stageName].error = errorKind;
    });
  }

  public failRunNoCheckpoint(): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("failed" !== this.state.stages[stageName].status) {
      return fail(REASON_CURRENT_NOT_FAILED);
    }
    if (0 !== this.state.checkpoint) {
      return fail("Checkpoint exists, use compensation");
    }
    this.update((draft) => {
      draft.state = "failed";
    });
    return ok();
  }

  // ── Retry ──────────────────────────────────────────────────────

  public finishExecution(): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("executing" !== this.state.stages[stageName].status) {
      return fail(REASON_NOT_EXECUTING);
    }
    this.update((draft) => {
      draft.stages[stageName].status = "validating";
    });
    return ok();
  }

  public getArtifact(name: StageName): unknown {
    return this.state.artifacts[name];
  }

  public getStage(name: StageName): StageRecord {
    return this.state.stages[name];
  }

  // ── Claude API failures ────────────────────────────────────────

  public gitFail(): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("git_operating" !== this.state.stages[stageName].status) {
      return fail(REASON_NOT_GIT_OPERATING);
    }
    this.update((draft) => {
      draft.stages[stageName].status = "failed";
      draft.stages[stageName].error = "git_failure";
      draft.gitOwner = undefined;
    });
    return ok();
  }

  public gitRetry(maxRetries: number): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("git_operating" !== this.state.stages[stageName].status) {
      return fail(REASON_NOT_GIT_OPERATING);
    }
    if (this.state.stages[stageName].retries >= maxRetries) {
      return fail(REASON_RETRIES_AT_CAP);
    }
    this.update((draft) => {
      draft.stages[stageName].status = "retrying";
      draft.stages[stageName].error = "git_failure";
      draft.stages[stageName].retries += 1;
      draft.gitOwner = undefined;
    });
    return ok();
  }

  // ── Pair routing ───────────────────────────────────────────────

  public gitRetryExhausted(maxRetries: number): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("git_operating" !== this.state.stages[stageName].status) {
      return fail(REASON_NOT_GIT_OPERATING);
    }
    if (this.state.stages[stageName].retries < maxRetries) {
      return fail(REASON_RETRIES_NOT_AT_CAP);
    }
    this.update((draft) => {
      draft.stages[stageName].status = "failed";
      draft.stages[stageName].error = "git_retry_exhausted";
      draft.gitOwner = undefined;
    });
    return ok();
  }

  public gitSuccess(artifact?: unknown): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("git_operating" !== this.state.stages[stageName].status) {
      return fail(REASON_NOT_GIT_OPERATING);
    }
    this.update((draft) => {
      draft.stages[stageName].status = "completed";
      draft.stages[stageName].artifact = artifact;
      draft.gitOwner = undefined;
    });
    return ok();
  }

  // ── Git operations ─────────────────────────────────────────────

  public markStageCompensated(stageName: StageName): void {
    this.update((draft) => {
      draft.stages[stageName].status = "compensated";
    });
  }

  public markStageCompensating(stageName: StageName): void {
    this.update((draft) => {
      draft.stages[stageName].status = "compensating";
    });
  }

  public markStageCompensationFailed(stageName: StageName): void {
    this.update((draft) => {
      draft.stages[stageName].status = "compensation_failed";
      draft.state = "failed";
    });
  }

  public pairRoutingApiFail(maxRetries: number): TransitionResult {
    const stageName = this.currentStageName;
    if (stageName !== PairStage) {
      return fail(REASON_NOT_PAIR_STAGE);
    }
    if ("pair_routing" !== this.state.stages[stageName].status) {
      return fail(REASON_NOT_PAIR_ROUTING);
    }
    if (this.state.stages[stageName].retries >= maxRetries) {
      return fail(REASON_RETRIES_AT_CAP);
    }
    this.update((draft) => {
      draft.stages[stageName].status = "retrying";
      draft.stages[stageName].error = "pair_routing_api_failed";
      draft.stages[stageName].retries += 1;
    });
    return ok();
  }

  public retryAfterValidationFail(maxRetries: number): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("validation_failed" !== this.state.stages[stageName].status) {
      return fail(REASON_NOT_VALIDATION_FAILED);
    }
    if (this.state.stages[stageName].retries >= maxRetries) {
      return fail(REASON_RETRIES_AT_CAP);
    }
    this.update((draft) => {
      draft.stages[stageName].status = "retrying";
      draft.stages[stageName].retries += 1;
    });
    return ok();
  }

  // ── Compensation ───────────────────────────────────────────────

  public retryExhausted(maxRetries: number): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("validation_failed" !== this.state.stages[stageName].status) {
      return fail(REASON_NOT_VALIDATION_FAILED);
    }
    if (this.state.stages[stageName].retries < maxRetries) {
      return fail(REASON_RETRIES_NOT_AT_CAP);
    }
    this.update((draft) => {
      draft.stages[stageName].status = "failed";
      draft.stages[stageName].error = "retry_exhausted";
    });
    return ok();
  }

  public retryToExecuting(): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("retrying" !== this.state.stages[stageName].status) {
      return fail("Stage not retrying");
    }
    this.update((draft) => {
      draft.stages[stageName].status = "executing";
    });
    return ok();
  }

  public startRun(): TransitionResult {
    if ("idle" !== this.state.state) {
      return fail("Run must be idle to start");
    }
    this.update((draft) => {
      draft.state = "running";
      draft.currentStage = 1;
      draft.stages.Questioner.status = "streaming_input";
    });
    return ok();
  }

  public storeArtifact(stageName: StageName, artifact: unknown): void {
    this.update((draft) => {
      draft.artifacts[stageName] = artifact;
    });
  }

  // ── Compensation helpers (used by compensation engine) ─────────

  public streamInput(maxStreamTurns: number): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName || !StreamingStages.has(stageName)) {
      return fail(REASON_NOT_STREAMING);
    }
    const stage = this.state.stages[stageName];
    if ("streaming_input" !== stage.status) {
      return fail(REASON_NOT_STREAMING_INPUT);
    }
    if (stage.turns >= maxStreamTurns) {
      return fail("Turns at max");
    }
    this.update((draft) => {
      draft.stages[stageName].turns = stage.turns + 1;
    });
    return ok();
  }

  public streamLimitReached(maxStreamTurns: number): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName || !StreamingStages.has(stageName)) {
      return fail(REASON_NOT_STREAMING);
    }
    const stage = this.state.stages[stageName];
    if ("streaming_input" !== stage.status) {
      return fail(REASON_NOT_STREAMING_INPUT);
    }
    if (stage.turns < maxStreamTurns) {
      return fail("Turns not at max");
    }
    this.update((draft) => {
      draft.stages[stageName].status = "failed";
      draft.stages[stageName].error = "stream_limit_exceeded";
    });
    return ok();
  }

  public validationFail(): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("validating" !== this.state.stages[stageName].status) {
      return fail(REASON_NOT_VALIDATING);
    }
    this.update((draft) => {
      draft.stages[stageName].status = "validation_failed";
      draft.stages[stageName].error = "zod_validation";
    });
    return ok();
  }

  // ── Artifact storage ───────────────────────────────────────────

  public validationPass(artifact?: unknown): TransitionResult {
    const stageName = this.currentStageName;
    if (!stageName) {
      return fail(REASON_INVALID_STAGE);
    }
    if ("validating" !== this.state.stages[stageName].status) {
      return fail(REASON_NOT_VALIDATING);
    }
    this.update((draft) => {
      draft.stages[stageName].artifact = artifact;
      draft.stages[stageName].status = GitStages.has(stageName)
        ? "git_operating"
        : "completed";
    });
    return ok();
  }
}

// ── TransitionResult ───────────────────────────────────────────

function createInitialState(): PipelineState {
  const stages: Partial<StageMap> = {};
  for (const stage of STAGES) {
    stages[stage] = createEmptyStageRecord();
  }

  return {
    artifacts: {},
    checkpoint: 0,
    currentStage: 0,
    gitOwner: undefined,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- all keys populated by loop above
    stages: stages as StageMap,
    state: "idle",
  };
}

function fail(reason: string): TransitionResult {
  return { ok: false, reason };
}

function ok(): TransitionResult {
  return { ok: true };
}
