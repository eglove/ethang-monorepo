import type { FileOperations, LlmProvider } from "../util/interfaces.ts";

import { StageStore } from "./stage-store.ts";

export class DebateModeratorStore extends StageStore {
  public readonly fileOperations: FileOperations;
  public get expertPositions(): readonly {
    expert: string;
    position: string;
  }[] {
    return this._expertPositions;
  }
  public get roundCount(): number {
    return this._roundCount;
  }

  private readonly _expertPositions: { expert: string; position: string }[] =
    [];

  private _roundCount = 0;

  public constructor(llmProvider: LlmProvider, fileOperations: FileOperations) {
    super(2, llmProvider);
    this.fileOperations = fileOperations;
  }

  public addExpertPosition(expert: string, position: string): void {
    this._expertPositions.push({ expert, position });
  }

  public incrementRound(): void {
    this._roundCount += 1;
  }
}
