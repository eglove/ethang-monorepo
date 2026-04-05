import type { FileOperations, LlmProvider } from "../util/interfaces.ts";

import { StageStore } from "./stage-store.ts";

export class ImplementationPlanningStore extends StageStore {
  public readonly fileOperations: FileOperations;

  public constructor(llmProvider: LlmProvider, fileOperations: FileOperations) {
    super(5, llmProvider);
    this.fileOperations = fileOperations;
  }
}
