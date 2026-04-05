import { BaseStore } from "@ethang/store";

import { isDAG } from "../util/dag.ts";
import { RunState, StageState } from "../util/enums.ts";
import {
  ErrorKind,
  isResultError,
  ok,
  type Result,
  resultError,
} from "../util/result.ts";

export type OrchestratorState = {
  currentStage: number;
  runState: RunState;
  stageCreated: Record<number, boolean>;
  stageDestroyed: Record<number, boolean>;
  subscriptions: (readonly [number, number])[];
};

const createInitialState = (numberStages: number): OrchestratorState => {
  const stageCreated: Record<number, boolean> = {};
  const stageDestroyed: Record<number, boolean> = {};

  for (let index = 1; numberStages >= index; index += 1) {
    stageCreated[index] = false;
    stageDestroyed[index] = false;
  }

  return {
    currentStage: 0,
    runState: RunState.Idle,
    stageCreated,
    stageDestroyed,
    subscriptions: [],
  };
};

export class OrchestratorStore extends BaseStore<OrchestratorState> {
  public readonly numberStages: number;

  public constructor(numberStages: number) {
    super(createInitialState(numberStages));
    this.numberStages = numberStages;
  }

  // T16: Abort Lifecycle
  public abortPipeline(): Result<null> {
    if (RunState.Running !== this.state.runState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot abort pipeline from run state "${this.state.runState}"`,
      );
    }

    this.update((draft) => {
      draft.runState = RunState.Aborting;
    });

    return ok(null);
  }

  // T14: AdvanceStage
  public advanceStage(currentStageState: StageState): Result<null> {
    if (RunState.Running !== this.state.runState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot advance stage from run state "${this.state.runState}"`,
      );
    }

    if (this.state.currentStage >= this.numberStages) {
      return resultError(
        ErrorKind.ValidationError,
        "Already at last stage, use completePipeline instead",
      );
    }

    if (StageState.Complete !== currentStageState) {
      return resultError(
        ErrorKind.ValidationError,
        `Current stage must be complete to advance (state: "${currentStageState}")`,
      );
    }

    const { currentStage, subscriptions } = this.state;
    const nextStage = currentStage + 1;
    const newEdge = [currentStage, nextStage] as const;
    const newSubscriptions = [...subscriptions, newEdge];

    const dagResult = isDAG(newSubscriptions);
    if (isResultError(dagResult)) {
      return dagResult;
    }

    this.update((draft) => {
      draft.stageDestroyed[currentStage] = true;
      draft.currentStage = nextStage;
      draft.stageCreated[nextStage] = true;
      draft.subscriptions = newSubscriptions;
    });

    return ok(null);
  }

  public completeAbort(): Result<null> {
    if (RunState.Aborting !== this.state.runState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot complete abort from run state "${this.state.runState}"`,
      );
    }

    this.update((draft) => {
      draft.runState = RunState.Aborted;
    });

    return ok(null);
  }

  // T15: CompletePipeline and PipelineError
  public completePipeline(currentStageState: StageState): Result<null> {
    if (RunState.Running !== this.state.runState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot complete pipeline from run state "${this.state.runState}"`,
      );
    }

    if (this.state.currentStage !== this.numberStages) {
      return resultError(
        ErrorKind.ValidationError,
        "Cannot complete pipeline before reaching last stage",
      );
    }

    if (StageState.Complete !== currentStageState) {
      return resultError(
        ErrorKind.ValidationError,
        `Last stage must be complete (state: "${currentStageState}")`,
      );
    }

    this.update((draft) => {
      draft.runState = RunState.Complete;

      for (let index = 1; this.numberStages >= index; index += 1) {
        draft.stageDestroyed[index] = true;
      }
    });

    return ok(null);
  }

  public handlePipelineError(
    currentStageState: StageState,
    retriesExhausted: boolean,
  ): Result<null> {
    if (RunState.Running !== this.state.runState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot handle pipeline error from run state "${this.state.runState}"`,
      );
    }

    if (StageState.Error !== currentStageState) {
      return resultError(
        ErrorKind.ValidationError,
        `Stage must be in error state (state: "${currentStageState}")`,
      );
    }

    if (!retriesExhausted) {
      return resultError(
        ErrorKind.ValidationError,
        "Retries not yet exhausted",
      );
    }

    this.update((draft) => {
      draft.runState = RunState.Error;
    });

    return ok(null);
  }

  public start(): Result<null> {
    if (RunState.Idle !== this.state.runState) {
      return resultError(
        ErrorKind.ValidationError,
        `Cannot start pipeline from state "${this.state.runState}"`,
      );
    }

    this.update((draft) => {
      draft.runState = RunState.Running;
      draft.currentStage = 1;
      draft.stageCreated[1] = true;
    });

    return ok(null);
  }
}
