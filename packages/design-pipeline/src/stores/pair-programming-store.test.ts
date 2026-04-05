import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import { StageState } from "../util/enums.ts";
import { isOk, ok } from "../util/result.ts";
import { PairProgrammingStore } from "./pair-programming-store.ts";

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

const mockGit = {
  // eslint-disable-next-line @typescript-eslint/require-await
  add: async () => ok("added"),
  // eslint-disable-next-line @typescript-eslint/require-await
  commit: async () => ok("sha"),
  // eslint-disable-next-line @typescript-eslint/require-await
  createBranch: async () => ok("branch"),
  // eslint-disable-next-line @typescript-eslint/require-await
  diff: async () => ok(""),
  // eslint-disable-next-line @typescript-eslint/require-await
  status: async () => ok("clean"),
};

describe("PairProgrammingStore", () => {
  it("initializes with stageId 6", () => {
    const store = new PairProgrammingStore(mockLlm, mockFs, mockGit);
    expect(store.state.stageId).toBe(6);
    expect(store.state.stageState).toBe(StageState.Idle);
  });

  it("inherits abort lifecycle", () => {
    const store = new PairProgrammingStore(mockLlm, mockFs, mockGit);
    store.activate();
    expect(isOk(store.abort())).toBe(true);
    expect(isOk(store.completeAbort())).toBe(true);
    expect(store.state.stageState).toBe(StageState.Aborted);
  });
});
