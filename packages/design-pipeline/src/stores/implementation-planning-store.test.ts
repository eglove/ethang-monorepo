import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import { StageState } from "../util/enums.ts";
import { isOk, ok } from "../util/result.ts";
import { ImplementationPlanningStore } from "./implementation-planning-store.ts";

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

describe("ImplementationPlanningStore", () => {
  it("initializes with stageId 5", () => {
    const store = new ImplementationPlanningStore(mockLlm, mockFs);
    expect(store.state.stageId).toBe(5);
    expect(store.state.stageState).toBe(StageState.Idle);
  });

  it("inherits full LLM lifecycle", () => {
    const store = new ImplementationPlanningStore(mockLlm, mockFs);
    store.activate();
    expect(isOk(store.requestLlm())).toBe(true);
    store.handleStreamStart();
    store.handleStreamComplete();
    expect(isOk(store.decideComplete())).toBe(true);
    expect(store.state.stageState).toBe(StageState.Complete);
  });
});
