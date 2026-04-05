import type { FileOperations, LlmProvider } from "../util/interfaces.ts";

import { StageStore } from "./stage-store.ts";

export type ReviewerVerdict = {
  reviewerName: string;
  verdict: "fail" | "pass";
};

export class ExpertReviewStore extends StageStore {
  public readonly fileOperations: FileOperations;
  public get verdicts(): readonly ReviewerVerdict[] {
    return this._verdicts;
  }

  private readonly _verdicts: ReviewerVerdict[] = [];

  public constructor(llmProvider: LlmProvider, fileOperations: FileOperations) {
    super(3, llmProvider);
    this.fileOperations = fileOperations;
  }

  public addVerdict(verdict: ReviewerVerdict): void {
    this._verdicts.push(verdict);
  }
}
