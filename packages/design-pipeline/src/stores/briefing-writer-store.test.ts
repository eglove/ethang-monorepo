import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import { StageState } from "../util/enums.ts";
import { isOk, ok } from "../util/result.ts";
import { BriefingWriterStore } from "./briefing-writer-store.ts";

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

describe("BriefingWriterStore", () => {
  it("initializes with stageId 4", () => {
    const store = new BriefingWriterStore(mockLlm, mockFs);
    expect(store.state.stageId).toBe(4);
    expect(store.state.stageState).toBe(StageState.Idle);
  });

  it("LLM + write workflow completes", () => {
    const store = new BriefingWriterStore(mockLlm, mockFs);
    store.activate();
    store.requestLlm();
    store.handleStreamStart();
    store.handleStreamComplete();
    expect(isOk(store.decideComplete())).toBe(true);
  });

  it("handles retry on file write failure path", () => {
    const store = new BriefingWriterStore(mockLlm, mockFs);
    store.activate();
    expect(isOk(store.handleDirectError())).toBe(true);
    expect(store.state.stageState).toBe(StageState.Retrying);
  });
});
