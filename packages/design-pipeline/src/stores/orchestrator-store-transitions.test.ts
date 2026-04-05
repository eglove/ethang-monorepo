import { describe, expect, it } from "vitest";

import { RunState, StageState } from "../util/enums.ts";
import { isOk, isResultError } from "../util/result.ts";
import { createTestOrchestratorStore } from "./testable-orchestrator-store.ts";

describe("OrchestratorStore advanceStage", () => {
  it("advances from stage 1 to stage 2", () => {
    const { store } = createTestOrchestratorStore(3);
    store.start();
    const result = store.advanceStage(StageState.Complete);
    expect(isOk(result)).toBe(true);
    expect(store.state.currentStage).toBe(2);
    expect(store.state.stageCreated[2]).toBe(true);
    expect(store.state.stageDestroyed[1]).toBe(true);
  });

  it("adds subscription edge on advance", () => {
    const { store } = createTestOrchestratorStore(3);
    store.start();
    store.advanceStage(StageState.Complete);
    expect(store.state.subscriptions).toStrictEqual([[1, 2]]);
  });

  it("fails when current stage not complete", () => {
    const { store } = createTestOrchestratorStore(3);
    store.start();
    const result = store.advanceStage(StageState.Active);
    expect(isResultError(result)).toBe(true);
  });

  it("fails when already at last stage", () => {
    const { forceState, store } = createTestOrchestratorStore(3);
    forceState({
      currentStage: 3,
      runState: RunState.Running,
      stageCreated: { 1: true, 2: true, 3: true },
    });
    const result = store.advanceStage(StageState.Complete);
    expect(isResultError(result)).toBe(true);
  });

  it("sequential advances produce valid DAG", () => {
    const { store } = createTestOrchestratorStore(3);
    store.start();
    store.advanceStage(StageState.Complete);
    store.advanceStage(StageState.Complete);
    expect(store.state.subscriptions).toStrictEqual([
      [1, 2],
      [2, 3],
    ]);
    expect(store.state.currentStage).toBe(3);
  });

  it("fails during abort", () => {
    const { forceState, store } = createTestOrchestratorStore(3);
    forceState({ currentStage: 1, runState: RunState.Aborting });
    const result = store.advanceStage(StageState.Complete);
    expect(isResultError(result)).toBe(true);
  });
});

describe("OrchestratorStore completePipeline", () => {
  it("completes when at last stage and stage is complete", () => {
    const { store } = createTestOrchestratorStore(3);
    store.start();
    store.advanceStage(StageState.Complete);
    store.advanceStage(StageState.Complete);
    const result = store.completePipeline(StageState.Complete);
    expect(isOk(result)).toBe(true);
    expect(store.state.runState).toBe(RunState.Complete);
  });

  it("destroys all stages on complete", () => {
    const { store } = createTestOrchestratorStore(3);
    store.start();
    store.advanceStage(StageState.Complete);
    store.advanceStage(StageState.Complete);
    store.completePipeline(StageState.Complete);
    expect(store.state.stageDestroyed[1]).toBe(true);
    expect(store.state.stageDestroyed[2]).toBe(true);
    expect(store.state.stageDestroyed[3]).toBe(true);
  });

  it("fails when not at last stage", () => {
    const { store } = createTestOrchestratorStore(3);
    store.start();
    const result = store.completePipeline(StageState.Complete);
    expect(isResultError(result)).toBe(true);
  });

  it("fails when last stage not complete", () => {
    const { forceState, store } = createTestOrchestratorStore(3);
    forceState({
      currentStage: 3,
      runState: RunState.Running,
      stageCreated: { 1: true, 2: true, 3: true },
    });
    const result = store.completePipeline(StageState.Active);
    expect(isResultError(result)).toBe(true);
  });
});

describe("OrchestratorStore handlePipelineError", () => {
  it("transitions to error when stage in error with retries exhausted", () => {
    const { store } = createTestOrchestratorStore(3);
    store.start();
    const result = store.handlePipelineError(StageState.Error, true);
    expect(isOk(result)).toBe(true);
    expect(store.state.runState).toBe(RunState.Error);
  });

  it("fails when retries not exhausted", () => {
    const { store } = createTestOrchestratorStore(3);
    store.start();
    const result = store.handlePipelineError(StageState.Error, false);
    expect(isResultError(result)).toBe(true);
  });

  it("fails when stage not in error", () => {
    const { store } = createTestOrchestratorStore(3);
    store.start();
    const result = store.handlePipelineError(StageState.Active, true);
    expect(isResultError(result)).toBe(true);
  });
});

describe("OrchestratorStore abort lifecycle", () => {
  it("abortPipeline from running -> aborting", () => {
    const { store } = createTestOrchestratorStore(3);
    store.start();
    expect(isOk(store.abortPipeline())).toBe(true);
    expect(store.state.runState).toBe(RunState.Aborting);
  });

  it("abortPipeline from non-running -> err", () => {
    const { store } = createTestOrchestratorStore(3);
    expect(isResultError(store.abortPipeline())).toBe(true);
  });

  it("completeAbort from aborting -> aborted", () => {
    const { store } = createTestOrchestratorStore(3);
    store.start();
    store.abortPipeline();
    expect(isOk(store.completeAbort())).toBe(true);
    expect(store.state.runState).toBe(RunState.Aborted);
  });

  it("full abort: start -> advance -> abort -> completeAbort", () => {
    const { store } = createTestOrchestratorStore(3);
    store.start();
    store.advanceStage(StageState.Complete);
    store.abortPipeline();
    store.completeAbort();
    expect(store.state.runState).toBe(RunState.Aborted);
    expect(store.state.stageDestroyed[1]).toBe(true);
  });

  it("advanceStage fails during aborting", () => {
    const { store } = createTestOrchestratorStore(3);
    store.start();
    store.abortPipeline();
    const result = store.advanceStage(StageState.Complete);
    expect(isResultError(result)).toBe(true);
  });
});
