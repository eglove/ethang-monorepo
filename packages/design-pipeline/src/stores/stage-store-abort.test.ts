import { describe, expect, it } from "vitest";

import { LlmState, StageState } from "../util/enums.ts";
import { isOk, isResultError } from "../util/result.ts";
import { createTestStageStore } from "./testable-stage-store.ts";

describe("StageStore abort lifecycle", () => {
  describe("abort", () => {
    it("from active -> aborting", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Active });
      expect(isOk(store.abort())).toBe(true);
      expect(store.state.stageState).toBe(StageState.Aborting);
    });

    it("from streaming -> aborting", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Streaming });
      expect(isOk(store.abort())).toBe(true);
      expect(store.state.stageState).toBe(StageState.Aborting);
    });

    it("from retrying -> aborting", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Retrying });
      expect(isOk(store.abort())).toBe(true);
      expect(store.state.stageState).toBe(StageState.Aborting);
    });

    it("from idle -> err", () => {
      const { store } = createTestStageStore();
      expect(isResultError(store.abort())).toBe(true);
    });

    it("from complete -> err", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Complete });
      expect(isResultError(store.abort())).toBe(true);
    });

    it("from error -> err", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Error });
      expect(isResultError(store.abort())).toBe(true);
    });
  });

  describe("completeAbort", () => {
    it("from aborting -> aborted with stageDestroyed true", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Aborting });
      expect(isOk(store.completeAbort())).toBe(true);
      expect(store.state.stageState).toBe(StageState.Aborted);
      expect(store.state.stageDestroyed).toBe(true);
    });

    it("errors in-flight LLM when requesting", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.Requesting,
        stageState: StageState.Aborting,
      });
      store.completeAbort();
      expect(store.state.llmState).toBe(LlmState.Error);
    });

    it("errors in-flight LLM when streaming-active", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.StreamingActive,
        stageState: StageState.Aborting,
      });
      store.completeAbort();
      expect(store.state.llmState).toBe(LlmState.Error);
    });

    it("errors in-flight LLM when streaming-interrupted", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.StreamingInterrupted,
        stageState: StageState.Aborting,
      });
      store.completeAbort();
      expect(store.state.llmState).toBe(LlmState.Error);
    });

    it("leaves idle llmState unchanged", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ llmState: LlmState.Idle, stageState: StageState.Aborting });
      store.completeAbort();
      expect(store.state.llmState).toBe(LlmState.Idle);
    });

    it("leaves complete llmState unchanged", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.Complete,
        stageState: StageState.Aborting,
      });
      store.completeAbort();
      expect(store.state.llmState).toBe(LlmState.Complete);
    });

    it("fails from non-aborting state", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Active });
      expect(isResultError(store.completeAbort())).toBe(true);
    });
  });
});
