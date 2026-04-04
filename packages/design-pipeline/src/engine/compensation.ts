import type { GitAdapter } from "../ports/git-adapter.ts";
import type { PipelineStore } from "./pipeline-store.ts";

import { STAGES } from "../constants.ts";

export type CompensationResult = {
  error?: string;
  success: boolean;
};

export async function executeCompensation(
  store: PipelineStore,
  gitAdapter: GitAdapter,
  runId: string,
): Promise<CompensationResult> {
  if ("compensating" !== store.state.state) {
    return { error: "Run not compensating", success: false };
  }

  if (0 >= store.state.checkpoint) {
    return {
      error: "No checkpoint to compensate",
      success: false,
    };
  }

  gitAdapter.releaseLock(runId);

  for (
    let index = store.state.checkpoint - 1;
    0 <= index && STAGES[index] !== undefined;
    index -= 1
  ) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const stageName = STAGES[index]!;

    if ("completed" !== store.state.stages[stageName].status) {
      // eslint-disable-next-line no-continue
      continue;
    }

    store.markStageCompensating(stageName);

    // eslint-disable-next-line no-await-in-loop
    const revertFailed = await tryRevertStage(store, stageName, gitAdapter);
    if (revertFailed) {
      return {
        error: `Compensation failed at stage ${stageName}`,
        success: false,
      };
    }

    store.markStageCompensated(stageName);
  }

  store.failCompensation();
  return { success: true };
}

export function shouldCompensate(store: PipelineStore): boolean {
  return 0 < store.state.checkpoint;
}

export function shouldFailDirectly(store: PipelineStore): boolean {
  return 0 === store.state.checkpoint;
}

async function tryRevertStage(
  store: PipelineStore,
  stageName: (typeof STAGES)[number],
  gitAdapter: GitAdapter,
): Promise<boolean> {
  if (store.state.stages[stageName].artifact === undefined) {
    return false;
  }

  const revertResult = await gitAdapter.checkout("HEAD~1");
  if (!revertResult.ok) {
    store.markStageCompensationFailed(stageName);
    return true;
  }

  return false;
}
