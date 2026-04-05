import { BaseStore } from "@ethang/store";

import type { LlmProvider } from "../util/interfaces.ts";

import { LlmState, StageState } from "../util/enums.ts";
import { ErrorKind, ok, type Result, resultError } from "../util/result.ts";
import { type RetryConfig, retryWithBackoff } from "../util/retry.ts";

export type StageStoreState = {
  llmCalls: number;
  llmCompleted: number;
  llmState: LlmState;
  stageDestroyed: boolean;
  stageId: number;
  stageRetries: number;
  stageState: StageState;
};

const MAX_LLM_CALLS = 100;

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
  maxRetries: 3,
};

const ABORTABLE_STATES = new Set<StageState>([
  StageState.Active,
  StageState.Retrying,
  StageState.Streaming,
]);

const IN_FLIGHT_LLM_STATES = new Set<LlmState>([
  LlmState.Requesting,
  LlmState.StreamingActive,
  LlmState.StreamingInterrupted,
]);

const createInitialStageState = (stageId: number): StageStoreState => {
  return {
    llmCalls: 0,
    llmCompleted: 0,
    llmState: LlmState.Idle,
    stageDestroyed: false,
    stageId,
    stageRetries: 0,
    stageState: StageState.Idle,
  };
};

export class StageStore extends BaseStore<StageStoreState> {
  public readonly llmProvider: LlmProvider;
  public readonly maxRetries: number;
  public readonly timeoutMs: number;

  private readonly _retryConfig: RetryConfig;

  public constructor(
    stageId: number,
    llmProvider: LlmProvider,
    maxRetries = 3,
    timeoutMs = 120_000,
  ) {
    super(createInitialStageState(stageId));
    this.llmProvider = llmProvider;
    this.maxRetries = maxRetries;
    this.timeoutMs = timeoutMs;
    this._retryConfig = { ...DEFAULT_RETRY_CONFIG, maxRetries };
  }

  // T10: Abort Lifecycle
  public abort(): Result<null> {
    if (!ABORTABLE_STATES.has(this.state.stageState)) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot abort stage from state "${this.state.stageState}"`,
      );
    }

    this.update((draft) => {
      draft.stageState = StageState.Aborting;
    });

    return ok(null);
  }

  public activate(): Result<null> {
    if (StageState.Idle !== this.state.stageState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot activate stage from state "${this.state.stageState}"`,
      );
    }

    this.update((draft) => {
      draft.stageState = StageState.Active;
    });

    return ok(null);
  }

  public completeAbort(): Result<null> {
    if (StageState.Aborting !== this.state.stageState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot complete abort from state "${this.state.stageState}"`,
      );
    }

    this.update((draft) => {
      draft.stageState = StageState.Aborted;
      draft.stageDestroyed = true;

      if (IN_FLIGHT_LLM_STATES.has(draft.llmState)) {
        draft.llmState = LlmState.Error;
      }
    });

    return ok(null);
  }

  public completeDirectly(): Result<null> {
    if (StageState.Active !== this.state.stageState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot complete directly from state "${this.state.stageState}"`,
      );
    }

    if (0 < this.state.llmCompleted) {
      return resultError(
        ErrorKind.ValidationError,
        "Cannot complete directly with completed LLM calls (use decideComplete)",
      );
    }

    if (
      LlmState.Idle !== this.state.llmState &&
      LlmState.Complete !== this.state.llmState
    ) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot complete directly with in-flight LLM (state: "${this.state.llmState}")`,
      );
    }

    this.update((draft) => {
      draft.stageState = StageState.Complete;
    });

    return ok(null);
  }

  // T11: Stage Completion
  public decideComplete(): Result<null> {
    if (StageState.Active !== this.state.stageState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot decide complete from state "${this.state.stageState}"`,
      );
    }

    if (0 === this.state.llmCompleted) {
      return resultError(
        ErrorKind.ValidationError,
        "Cannot decide complete with no completed LLM calls (use completeDirectly)",
      );
    }

    if (
      LlmState.Idle !== this.state.llmState &&
      LlmState.Complete !== this.state.llmState
    ) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot decide complete with in-flight LLM (state: "${this.state.llmState}")`,
      );
    }

    this.update((draft) => {
      draft.stageState = StageState.Complete;
    });

    return ok(null);
  }

  public handleDirectError(): Result<{ delayMs: number }> {
    if (StageState.Active !== this.state.stageState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot handle direct error from state "${this.state.stageState}"`,
      );
    }

    if (
      LlmState.Idle !== this.state.llmState &&
      LlmState.Complete !== this.state.llmState
    ) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot handle direct error with in-flight LLM (state: "${this.state.llmState}")`,
      );
    }

    const retry = retryWithBackoff(this.state.stageRetries, this._retryConfig);

    if (retry.exhausted) {
      this.update((draft) => {
        draft.stageState = StageState.Error;
        draft.llmState = LlmState.Error;
      });
      return ok({ delayMs: 0 });
    }

    this.update((draft) => {
      draft.stageState = StageState.Retrying;
      draft.stageRetries += 1;
    });

    return ok({ delayMs: retry.delayMs });
  }

  public handleRequestFail(): Result<{ delayMs: number }> {
    if (LlmState.Requesting !== this.state.llmState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot handle request fail from LLM state "${this.state.llmState}"`,
      );
    }

    const retry = retryWithBackoff(this.state.stageRetries, this._retryConfig);

    if (retry.exhausted) {
      this.update((draft) => {
        draft.stageState = StageState.Error;
        draft.llmState = LlmState.Error;
      });
      return ok({ delayMs: 0 });
    }

    this.update((draft) => {
      draft.stageState = StageState.Retrying;
      draft.stageRetries += 1;
      draft.llmState = LlmState.Idle;
    });

    return ok({ delayMs: retry.delayMs });
  }

  public handleStreamComplete(): Result<null> {
    if (LlmState.StreamingActive !== this.state.llmState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot complete stream from LLM state "${this.state.llmState}"`,
      );
    }

    this.update((draft) => {
      draft.llmState = LlmState.Complete;
      draft.stageState = StageState.Active;
      draft.llmCompleted += 1;
    });

    return ok(null);
  }

  // T12: LLM Failure Paths
  public handleStreamInterrupt(): Result<null> {
    if (LlmState.StreamingActive !== this.state.llmState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot interrupt stream from LLM state "${this.state.llmState}"`,
      );
    }

    this.update((draft) => {
      draft.llmState = LlmState.StreamingInterrupted;
    });

    return ok(null);
  }

  public handleStreamStart(): Result<null> {
    if (LlmState.Requesting !== this.state.llmState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot start stream from LLM state "${this.state.llmState}"`,
      );
    }

    this.update((draft) => {
      draft.llmState = LlmState.StreamingActive;
      draft.stageState = StageState.Streaming;
    });

    return ok(null);
  }

  public handleTimeout(): Result<{ delayMs: number }> {
    if (
      StageState.Active !== this.state.stageState &&
      StageState.Streaming !== this.state.stageState
    ) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot handle timeout from state "${this.state.stageState}"`,
      );
    }

    const retry = retryWithBackoff(this.state.stageRetries, this._retryConfig);

    if (retry.exhausted) {
      this.update((draft) => {
        draft.stageState = StageState.Error;
        if (LlmState.StreamingActive === draft.llmState) {
          draft.llmState = LlmState.Error;
        }
      });
      return ok({ delayMs: 0 });
    }

    this.update((draft) => {
      draft.stageState = StageState.Retrying;
      draft.stageRetries += 1;

      if (LlmState.StreamingActive === draft.llmState) {
        draft.llmState = LlmState.Idle;
      }
    });

    return ok({ delayMs: retry.delayMs });
  }

  public requestLlm(): Result<null> {
    if (StageState.Active !== this.state.stageState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot request LLM from stage state "${this.state.stageState}"`,
      );
    }

    if (
      LlmState.Idle !== this.state.llmState &&
      LlmState.Complete !== this.state.llmState
    ) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot request LLM from LLM state "${this.state.llmState}"`,
      );
    }

    if (this.state.llmCalls >= MAX_LLM_CALLS) {
      return resultError(
        ErrorKind.ValidationError,
        "Maximum LLM calls exceeded",
      );
    }

    this.update((draft) => {
      draft.llmState = LlmState.Requesting;
      draft.llmCalls += 1;
    });

    return ok(null);
  }

  public resolveInterrupt(): Result<{ delayMs: number }> {
    if (LlmState.StreamingInterrupted !== this.state.llmState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot resolve interrupt from LLM state "${this.state.llmState}"`,
      );
    }

    const retry = retryWithBackoff(this.state.stageRetries, this._retryConfig);

    if (retry.exhausted) {
      this.update((draft) => {
        draft.stageState = StageState.Error;
        draft.llmState = LlmState.Error;
      });
      return ok({ delayMs: 0 });
    }

    this.update((draft) => {
      draft.stageState = StageState.Retrying;
      draft.stageRetries += 1;
      draft.llmState = LlmState.Idle;
    });

    return ok({ delayMs: retry.delayMs });
  }

  // T13: RetryResume, DirectError, Timeout
  public retryResume(): Result<null> {
    if (StageState.Retrying !== this.state.stageState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot resume retry from state "${this.state.stageState}"`,
      );
    }

    this.update((draft) => {
      draft.stageState = StageState.Active;
    });

    return ok(null);
  }
}
