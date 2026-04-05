import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import { StageState } from "../util/enums.ts";
import { isOk, ok } from "../util/result.ts";
import { DebateModeratorStore } from "./debate-moderator-store.ts";

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

describe("DebateModeratorStore", () => {
  it("initializes with correct stageId", () => {
    const store = new DebateModeratorStore(mockLlm, mockFs);
    expect(store.state.stageId).toBe(2);
    expect(store.roundCount).toBe(0);
    expect(store.expertPositions).toStrictEqual([]);
  });

  it("tracks expert positions and rounds", () => {
    const store = new DebateModeratorStore(mockLlm, mockFs);
    store.addExpertPosition("expert-1", "approach A");
    store.incrementRound();
    expect(store.expertPositions).toHaveLength(1);
    expect(store.roundCount).toBe(1);
  });

  it("inherits LLM and abort lifecycle", () => {
    const store = new DebateModeratorStore(mockLlm, mockFs);
    store.activate();
    expect(isOk(store.requestLlm())).toBe(true);
    store.handleStreamStart();
    store.handleStreamComplete();
    expect(store.state.stageState).toBe(StageState.Active);
  });
});
