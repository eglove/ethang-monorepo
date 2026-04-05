import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import { StageState } from "../util/enums.ts";
import { isOk, ok } from "../util/result.ts";
import { TlaWriterStore } from "./tla-writer-store.ts";

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

describe("TlaWriterStore", () => {
  it("initializes with correct state", () => {
    const store = new TlaWriterStore(mockLlm, mockFs);
    expect(store.state.stageId).toBe(9);
    expect(store.state.stageState).toBe(StageState.Idle);
  });

  it("LLM + file write workflow", () => {
    const store = new TlaWriterStore(mockLlm, mockFs);
    store.activate();
    store.requestLlm();
    store.handleStreamStart();
    store.handleStreamComplete();
    expect(isOk(store.decideComplete())).toBe(true);
  });

  it("handles abort and timeout", () => {
    const store = new TlaWriterStore(mockLlm, mockFs);
    store.activate();
    expect(isOk(store.handleTimeout())).toBe(true);
    expect(store.state.stageState).toBe(StageState.Retrying);
  });
});
