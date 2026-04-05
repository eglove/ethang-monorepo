import { BaseStore } from "@ethang/store";

import { RunState } from "../util/enums.ts";
import { ErrorKind, ok, type Result, resultError } from "../util/result.ts";

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
