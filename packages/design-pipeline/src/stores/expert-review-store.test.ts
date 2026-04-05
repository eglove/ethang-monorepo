import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import { StageState } from "../util/enums.ts";
import { isOk, ok } from "../util/result.ts";
import { ExpertReviewStore } from "./expert-review-store.ts";

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

describe("ExpertReviewStore", () => {
  it("initializes with stageId 3 and empty verdicts", () => {
    const store = new ExpertReviewStore(mockLlm, mockFs);
    expect(store.state.stageId).toBe(3);
    expect(store.verdicts).toStrictEqual([]);
  });

  it("tracks reviewer verdicts", () => {
    const store = new ExpertReviewStore(mockLlm, mockFs);
    store.addVerdict({ reviewerName: "security", verdict: "pass" });
    store.addVerdict({ reviewerName: "type-design", verdict: "fail" });
    expect(store.verdicts).toHaveLength(2);
  });

  it("inherits full stage lifecycle", () => {
    const store = new ExpertReviewStore(mockLlm, mockFs);
    store.activate();
    expect(isOk(store.abort())).toBe(true);
    expect(store.state.stageState).toBe(StageState.Aborting);
  });
});
