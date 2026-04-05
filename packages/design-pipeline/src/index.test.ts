import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import { createPipeline, startPipeline } from "./index.ts";
import { RunState } from "./util/enums.ts";
import { isOk, isResultError, ok } from "./util/result.ts";

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

describe("createPipeline", () => {
  it("creates all stores without error", () => {
    const result = createPipeline(mockLlm, mockFs, mockGit);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      result.value.destroy();
    }
  });

  it("subscription graph passes DAG validation", () => {
    const result = createPipeline(mockLlm, mockFs, mockGit);
    expect(isOk(result)).toBe(true);
  });

  it("destroy cleans up orchestrator", () => {
    const result = createPipeline(mockLlm, mockFs, mockGit);
    if (isOk(result)) {
      const { destroy, orchestrator } = result.value;
      destroy();
      expect(orchestrator.destroyed).toBe(true);
    }
  });
});

describe("startPipeline", () => {
  it("triggers pipeline execution", () => {
    const result = createPipeline(mockLlm, mockFs, mockGit);
    if (isOk(result)) {
      const { orchestrator } = result.value;
      const startResult = startPipeline(orchestrator);
      expect(isOk(startResult)).toBe(true);
      expect(orchestrator.state.runState).toBe(RunState.Running);
      expect(orchestrator.state.currentStage).toBe(1);
      orchestrator.destroy();
    }
  });

  it("second start returns error", () => {
    const result = createPipeline(mockLlm, mockFs, mockGit);
    if (isOk(result)) {
      const { orchestrator } = result.value;
      startPipeline(orchestrator);
      const secondStart = startPipeline(orchestrator);
      expect(isResultError(secondStart)).toBe(true);
      orchestrator.destroy();
    }
  });
});
