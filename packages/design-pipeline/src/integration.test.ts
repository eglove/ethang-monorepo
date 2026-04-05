import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import { createPipeline, startPipeline } from "./index.ts";
import { RunState, StageState } from "./util/enums.ts";
import { isOk, ok } from "./util/result.ts";

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

describe("integration: happy path", () => {
  it("pipeline starts and advances through stages to completion", () => {
    const pipelineResult = createPipeline(mockLlm, mockFs, mockGit, {
      numStages: 3,
    });
    expect(isOk(pipelineResult)).toBe(true);
    if (!isOk(pipelineResult)) return;

    const { destroy, orchestrator } = pipelineResult.value;

    // Start pipeline
    const startResult = startPipeline(orchestrator);
    expect(isOk(startResult)).toBe(true);
    expect(orchestrator.state.runState).toBe(RunState.Running);
    expect(orchestrator.state.currentStage).toBe(1);

    // Advance stage 1 -> 2
    orchestrator.advanceStage(StageState.Complete);
    expect(orchestrator.state.currentStage).toBe(2);
    expect(orchestrator.state.stageDestroyed[1]).toBe(true);

    // Advance stage 2 -> 3
    orchestrator.advanceStage(StageState.Complete);
    expect(orchestrator.state.currentStage).toBe(3);
    expect(orchestrator.state.stageDestroyed[2]).toBe(true);

    // Complete pipeline at last stage
    orchestrator.completePipeline(StageState.Complete);
    expect(orchestrator.state.runState).toBe(RunState.Complete);

    // All stages destroyed
    expect(orchestrator.state.stageDestroyed[1]).toBe(true);
    expect(orchestrator.state.stageDestroyed[2]).toBe(true);
    expect(orchestrator.state.stageDestroyed[3]).toBe(true);

    destroy();
    expect(orchestrator.destroyed).toBe(true);
  });
});

describe("integration: error path", () => {
  it("pipeline transitions to error when stage fails with retries exhausted", () => {
    const pipelineResult = createPipeline(mockLlm, mockFs, mockGit, {
      numStages: 3,
    });
    if (!isOk(pipelineResult)) return;

    const { destroy, orchestrator } = pipelineResult.value;

    startPipeline(orchestrator);
    expect(orchestrator.state.runState).toBe(RunState.Running);

    // Stage 1 enters error with retries exhausted
    orchestrator.handlePipelineError(StageState.Error, true);
    expect(orchestrator.state.runState).toBe(RunState.Error);

    destroy();
  });
});

describe("integration: abort path", () => {
  it("pipeline aborts during active stage", () => {
    const pipelineResult = createPipeline(mockLlm, mockFs, mockGit, {
      numStages: 3,
    });
    if (!isOk(pipelineResult)) return;

    const { destroy, orchestrator } = pipelineResult.value;

    startPipeline(orchestrator);
    orchestrator.advanceStage(StageState.Complete);
    expect(orchestrator.state.currentStage).toBe(2);

    // Abort during stage 2
    orchestrator.abortPipeline();
    expect(orchestrator.state.runState).toBe(RunState.Aborting);

    orchestrator.completeAbort();
    expect(orchestrator.state.runState).toBe(RunState.Aborted);

    // Stage 1 still destroyed from advance
    expect(orchestrator.state.stageDestroyed[1]).toBe(true);

    destroy();
  });
});

describe("integration: subscription DAG", () => {
  it("subscription graph is valid after full pipeline run", () => {
    const pipelineResult = createPipeline(mockLlm, mockFs, mockGit, {
      numStages: 3,
    });
    if (!isOk(pipelineResult)) return;

    const { destroy, orchestrator } = pipelineResult.value;

    startPipeline(orchestrator);
    orchestrator.advanceStage(StageState.Complete);
    orchestrator.advanceStage(StageState.Complete);
    orchestrator.completePipeline(StageState.Complete);

    expect(orchestrator.state.subscriptions).toStrictEqual([
      [1, 2],
      [2, 3],
    ]);

    destroy();
  });
});

describe("integration: store lifecycle", () => {
  it("no store leaks after terminal state", () => {
    const pipelineResult = createPipeline(mockLlm, mockFs, mockGit, {
      numStages: 2,
    });
    if (!isOk(pipelineResult)) return;

    const { destroy, orchestrator } = pipelineResult.value;

    startPipeline(orchestrator);
    orchestrator.advanceStage(StageState.Complete);
    orchestrator.completePipeline(StageState.Complete);

    // All stages destroyed
    expect(orchestrator.state.stageDestroyed[1]).toBe(true);
    expect(orchestrator.state.stageDestroyed[2]).toBe(true);

    destroy();
    expect(orchestrator.destroyed).toBe(true);
  });
});
