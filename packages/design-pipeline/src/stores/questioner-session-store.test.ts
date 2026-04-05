import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import { StageState } from "../util/enums.ts";
import { isOk, ok } from "../util/result.ts";
import { QuestionerSessionStore } from "./questioner-session-store.ts";

// eslint-disable-next-line @typescript-eslint/require-await
async function* noopStream() {
  yield { content: "", done: true };
}

const mockLlm = {
  // eslint-disable-next-line @typescript-eslint/require-await
  chat: async () => ok(noopStream()),
  getModel: constant("test-model"),
};

const mockFs = {
  // eslint-disable-next-line @typescript-eslint/require-await
  exists: async () => ok(true),
  // eslint-disable-next-line @typescript-eslint/require-await
  mkdir: async () => ok(),
  // eslint-disable-next-line @typescript-eslint/require-await
  readFile: async () => ok("content"),
  // eslint-disable-next-line @typescript-eslint/require-await
  writeFile: async () => ok(),
};

describe("QuestionerSessionStore", () => {
  it("initializes with default state", () => {
    const store = new QuestionerSessionStore(mockLlm, mockFs);
    expect(store.state.stageState).toBe(StageState.Idle);
    expect(store.currentRound).toBe(0);
    expect(store.maxRounds).toBe(5);
    expect(store.questionAnswerPairs).toStrictEqual([]);
  });

  it("accumulates question/answer pairs", () => {
    const store = new QuestionerSessionStore(mockLlm, mockFs);
    store.addQuestionAnswer("What is the goal?", "Build a CLI");
    store.addQuestionAnswer("What stack?", "TypeScript");
    expect(store.questionAnswerPairs).toHaveLength(2);
    expect(store.currentRound).toBe(2);
  });

  it("inherits LLM lifecycle from StageStore", () => {
    const store = new QuestionerSessionStore(mockLlm, mockFs);
    store.activate();
    expect(isOk(store.requestLlm())).toBe(true);
    expect(isOk(store.handleStreamStart())).toBe(true);
    expect(isOk(store.handleStreamComplete())).toBe(true);
  });

  it("handles abort lifecycle", () => {
    const store = new QuestionerSessionStore(mockLlm, mockFs);
    store.activate();
    expect(isOk(store.abort())).toBe(true);
    expect(isOk(store.completeAbort())).toBe(true);
    expect(store.state.stageState).toBe(StageState.Aborted);
  });
});
