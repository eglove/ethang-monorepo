import { describe, expect, it } from "vitest";

import { LlmState, StageState } from "../util/enums.ts";
import { isOk, isResultError } from "../util/result.ts";
import { createTestStageStore } from "./testable-stage-store.ts";

const EXHAUSTED_RETRIES = 3;

describe("StageStore LLM failure paths", () => {
  describe("handleStreamInterrupt", () => {
    it("from streaming-active -> streaming-interrupted", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.StreamingActive,
        stageState: StageState.Streaming,
      });
      expect(isOk(store.handleStreamInterrupt())).toBe(true);
      expect(store.state.llmState).toBe(LlmState.StreamingInterrupted);
    });

    it("interrupt fails from non-streaming-active llmState", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ llmState: LlmState.Idle, stageState: StageState.Active });
      expect(isResultError(store.handleStreamInterrupt())).toBe(true);
    });
  });

  describe("resolveInterrupt", () => {
    it("with retries remaining -> retrying with incremented stageRetries", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.StreamingInterrupted,
        stageState: StageState.Streaming,
      });
      const result = store.resolveInterrupt();
      expect(isOk(result)).toBe(true);
      expect(store.state.stageState).toBe(StageState.Retrying);
      expect(store.state.stageRetries).toBe(1);
      expect(store.state.llmState).toBe(LlmState.Idle);
    });

    it("resolveInterrupt with retries exhausted -> error", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.StreamingInterrupted,
        stageRetries: EXHAUSTED_RETRIES,
        stageState: StageState.Streaming,
      });
      store.resolveInterrupt();
      expect(store.state.stageState).toBe(StageState.Error);
      expect(store.state.llmState).toBe(LlmState.Error);
    });

    it("resolveInterrupt fails from non-interrupted llmState", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ llmState: LlmState.Idle, stageState: StageState.Active });
      expect(isResultError(store.resolveInterrupt())).toBe(true);
    });
  });

  describe("handleRequestFail", () => {
    it("with retries remaining -> retrying", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.Requesting,
        stageState: StageState.Active,
      });
      const result = store.handleRequestFail();
      expect(isOk(result)).toBe(true);
      expect(store.state.stageState).toBe(StageState.Retrying);
      expect(store.state.stageRetries).toBe(1);
      expect(store.state.llmState).toBe(LlmState.Idle);
    });

    it("handleRequestFail with retries exhausted -> error", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.Requesting,
        stageRetries: EXHAUSTED_RETRIES,
        stageState: StageState.Active,
      });
      store.handleRequestFail();
      expect(store.state.stageState).toBe(StageState.Error);
      expect(store.state.llmState).toBe(LlmState.Error);
    });

    it("handleRequestFail fails from non-requesting llmState", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ llmState: LlmState.Idle, stageState: StageState.Active });
      expect(isResultError(store.handleRequestFail())).toBe(true);
    });
  });
});

describe("StageStore retry, direct error, timeout", () => {
  describe("retryResume", () => {
    it("from retrying -> active", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Retrying });
      expect(isOk(store.retryResume())).toBe(true);
      expect(store.state.stageState).toBe(StageState.Active);
    });

    it("from non-retrying -> err", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Active });
      expect(isResultError(store.retryResume())).toBe(true);
    });
  });

  describe("handleDirectError", () => {
    it("with retries remaining -> retrying", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ llmState: LlmState.Idle, stageState: StageState.Active });
      expect(isOk(store.handleDirectError())).toBe(true);
      expect(store.state.stageState).toBe(StageState.Retrying);
    });

    it("handleDirectError with retries exhausted -> error", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.Idle,
        stageRetries: EXHAUSTED_RETRIES,
        stageState: StageState.Active,
      });
      store.handleDirectError();
      expect(store.state.stageState).toBe(StageState.Error);
      expect(store.state.llmState).toBe(LlmState.Error);
    });

    it("with in-flight LLM -> err", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.Requesting,
        stageState: StageState.Active,
      });
      expect(isResultError(store.handleDirectError())).toBe(true);
    });
  });

  describe("handleTimeout", () => {
    it("from active with retries remaining -> retrying", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ llmState: LlmState.Idle, stageState: StageState.Active });
      expect(isOk(store.handleTimeout())).toBe(true);
      expect(store.state.stageState).toBe(StageState.Retrying);
    });

    it("from active with retries exhausted -> error", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.Idle,
        stageRetries: EXHAUSTED_RETRIES,
        stageState: StageState.Active,
      });
      store.handleTimeout();
      expect(store.state.stageState).toBe(StageState.Error);
    });

    it("from streaming resets llmState to idle on retry", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.StreamingActive,
        stageState: StageState.Streaming,
      });
      expect(isOk(store.handleTimeout())).toBe(true);
      expect(store.state.stageState).toBe(StageState.Retrying);
      expect(store.state.llmState).toBe(LlmState.Idle);
    });

    it("from streaming with retries exhausted -> error with llmState error", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.StreamingActive,
        stageRetries: EXHAUSTED_RETRIES,
        stageState: StageState.Streaming,
      });
      store.handleTimeout();
      expect(store.state.stageState).toBe(StageState.Error);
      expect(store.state.llmState).toBe(LlmState.Error);
    });

    it("from non-active/streaming -> err", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Idle });
      expect(isResultError(store.handleTimeout())).toBe(true);
    });

    it("double-retry: timeout + interrupt resolve consume two retry slots", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.StreamingInterrupted,
        stageState: StageState.Streaming,
      });

      // Timeout fires first (consumes retry slot 1)
      store.handleTimeout();
      expect(store.state.stageRetries).toBe(1);
      expect(store.state.stageState).toBe(StageState.Retrying);

      // Resume to active
      store.retryResume();

      // Set up streaming-interrupted again
      forceState({
        llmState: LlmState.StreamingInterrupted,
        stageState: StageState.Streaming,
      });

      // resolveInterrupt fires (consumes retry slot 2)
      store.resolveInterrupt();
      expect(store.state.stageRetries).toBe(2);
    });
  });
});
