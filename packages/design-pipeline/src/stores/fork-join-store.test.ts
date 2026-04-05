import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import { StageState } from "../util/enums.ts";
import { isOk, ok } from "../util/result.ts";
import { ForkJoinStore } from "./fork-join-store.ts";

// eslint-disable-next-line @typescript-eslint/require-await
async function* noopStream() {
  yield { content: "", done: true };
}

const mockLlm = {
  // eslint-disable-next-line @typescript-eslint/require-await
  chat: async () => ok(noopStream()),
  getModel: constant("test-model"),
};

describe("ForkJoinStore", () => {
  it("initializes with default stageId", () => {
    const store = new ForkJoinStore(mockLlm);
    expect(store.state.stageId).toBe(7);
    expect(store.subtaskResults).toStrictEqual([]);
  });

  it("tracks parallel sub-task results", () => {
    const store = new ForkJoinStore(mockLlm);
    store.addSubtaskResult("task-1", "complete");
    store.addSubtaskResult("task-2", "error");
    expect(store.subtaskResults).toHaveLength(2);
  });

  it("inherits stage lifecycle", () => {
    const store = new ForkJoinStore(mockLlm);
    store.activate();
    expect(isOk(store.completeDirectly())).toBe(true);
    expect(store.state.stageState).toBe(StageState.Complete);
  });
});
