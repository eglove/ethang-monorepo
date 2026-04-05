import { BaseStore } from "@ethang/store";

import type { LlmProvider } from "../util/interfaces.ts";

import { LlmState, StageState } from "../util/enums.ts";
import { ErrorKind, ok, type Result, resultError } from "../util/result.ts";

export type StageStoreState = {
  llmCalls: number;
  llmCompleted: number;
  llmState: LlmState;
  stageId: number;
  stageRetries: number;
  stageState: StageState;
};

const MAX_LLM_CALLS = 100;

const createInitialStageState = (stageId: number): StageStoreState => {
  return {
    llmCalls: 0,
    llmCompleted: 0,
    llmState: LlmState.Idle,
    stageId,
    stageRetries: 0,
    stageState: StageState.Idle,
  };
};

export class StageStore extends BaseStore<StageStoreState> {
  public readonly llmProvider: LlmProvider;
  public readonly maxRetries: number;
  public readonly timeoutMs: number;

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
}
