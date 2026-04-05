import type { LlmProvider } from "../util/interfaces.ts";

import { StageStore } from "./stage-store.ts";

export class ForkJoinStore extends StageStore {
  public get subtaskResults(): readonly {
    status: "complete" | "error";
    taskId: string;
  }[] {
    return this._subtaskResults;
  }

  private readonly _subtaskResults: {
    status: "complete" | "error";
    taskId: string;
  }[] = [];

  public constructor(llmProvider: LlmProvider, stageId = 7) {
    super(stageId, llmProvider);
  }

  public addSubtaskResult(taskId: string, status: "complete" | "error"): void {
    this._subtaskResults.push({ status, taskId });
  }
}
