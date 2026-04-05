import type {
  FileOperations,
  GitOperations,
  LlmProvider,
} from "../util/interfaces.ts";

import { StageStore } from "./stage-store.ts";

export class PairProgrammingStore extends StageStore {
  public readonly fileOperations: FileOperations;
  public readonly gitOperations: GitOperations;

  public constructor(
    llmProvider: LlmProvider,
    fileOperations: FileOperations,
    gitOperations: GitOperations,
  ) {
    super(6, llmProvider);
    this.fileOperations = fileOperations;
    this.gitOperations = gitOperations;
  }
}
