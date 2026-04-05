import type { FileOperations, LlmProvider } from "../util/interfaces.ts";

import { StageStore, type StageStoreState } from "./stage-store.ts";

export type QuestionerSessionState = {
  currentRound: number;
  maxRounds: number;
  questionAnswerPairs: { answer: string; question: string }[];
} & StageStoreState;

export class QuestionerSessionStore extends StageStore {
  public readonly fileOperations: FileOperations;
  public get currentRound(): number {
    return this._currentRound;
  }
  public get maxRounds(): number {
    return this._maxRounds;
  }
  public get questionAnswerPairs(): readonly {
    answer: string;
    question: string;
  }[] {
    return this._questionAnswerPairs;
  }

  private _currentRound = 0;

  private readonly _maxRounds: number;

  private readonly _questionAnswerPairs: {
    answer: string;
    question: string;
  }[] = [];

  public constructor(
    llmProvider: LlmProvider,
    fileOperations: FileOperations,
    maxRounds = 5,
  ) {
    super(1, llmProvider);
    this.fileOperations = fileOperations;
    this._maxRounds = maxRounds;
  }

  public addQuestionAnswer(question: string, answer: string): void {
    this._questionAnswerPairs.push({ answer, question });
    this._currentRound += 1;
  }
}
