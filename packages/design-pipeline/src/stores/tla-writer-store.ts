import type { FileOperations, LlmProvider } from "../util/interfaces.ts";

import { StageStore } from "./stage-store.ts";

export class TlaWriterStore extends StageStore {
  public readonly fileOperations: FileOperations;

  public constructor(llmProvider: LlmProvider, fileOperations: FileOperations) {
    // TLA+ specification is stage 3.5 (between expert review and briefing)
    // but since stages are sequential, use a unique id
    super(9, llmProvider);
    this.fileOperations = fileOperations;
  }
}
