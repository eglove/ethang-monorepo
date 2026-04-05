import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import { StageState } from "../util/enums.ts";
import { isOk, ok } from "../util/result.ts";
import { LintFixerStore } from "./lint-fixer-store.ts";

// eslint-disable-next-line @typescript-eslint/require-await
async function* noopStream() {
  yield { content: "", done: true };
}

const mockLlm = {
  // eslint-disable-next-line @typescript-eslint/require-await
  chat: async () => ok(noopStream()),
  getModel: constant("test-model"),
};

describe("LintFixerStore", () => {
  it("initializes with passCount 0", () => {
    const store = new LintFixerStore(mockLlm);
    expect(store.passCount).toBe(0);
    expect(store.state.stageState).toBe(StageState.Idle);
  });

  it("tracks double-pass count", () => {
    const store = new LintFixerStore(mockLlm);
    store.incrementPass();
    store.incrementPass();
    expect(store.passCount).toBe(2);
  });

  it("uses completeDirectly for pure-computation phases", () => {
    const store = new LintFixerStore(mockLlm);
    store.activate();
    expect(isOk(store.completeDirectly())).toBe(true);
    expect(store.state.stageState).toBe(StageState.Complete);
  });

  it("handles timeout and retry", () => {
    const store = new LintFixerStore(mockLlm);
    store.activate();
    expect(isOk(store.handleTimeout())).toBe(true);
    expect(store.state.stageState).toBe(StageState.Retrying);
    expect(isOk(store.retryResume())).toBe(true);
    expect(store.state.stageState).toBe(StageState.Active);
  });
});
