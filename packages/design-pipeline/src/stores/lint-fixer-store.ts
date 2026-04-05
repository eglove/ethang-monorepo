import type { LlmProvider } from "../util/interfaces.ts";

import { StageStore } from "./stage-store.ts";

export class LintFixerStore extends StageStore {
  public get passCount(): number {
    return this._passCount;
  }

  private _passCount = 0;

  public constructor(llmProvider: LlmProvider, stageId = 8) {
    super(stageId, llmProvider);
  }

  public incrementPass(): void {
    this._passCount += 1;
  }
}
