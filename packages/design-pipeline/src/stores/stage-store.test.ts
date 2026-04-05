import constant from "lodash/constant.js";
import { describe, expect, it } from "vitest";

import { LlmState, StageState } from "../util/enums.ts";
import { isOk, isResultError, ok } from "../util/result.ts";
import { StageStore } from "./stage-store.ts";
import { createTestStageStore } from "./testable-stage-store.ts";

// eslint-disable-next-line @typescript-eslint/require-await
async function* noopStream() {
  yield { content: "", done: true };
}

const noopLlmProvider = {
  // eslint-disable-next-line @typescript-eslint/require-await
  chat: async () => ok(noopStream()),
  getModel: constant("test-model"),
};

describe("StageStore", () => {
  describe("initial state", () => {
    it("has stageState idle", () => {
      const store = new StageStore(1, noopLlmProvider);
      expect(store.state.stageState).toBe(StageState.Idle);
    });

    it("has stageRetries 0", () => {
      const store = new StageStore(1, noopLlmProvider);
      expect(store.state.stageRetries).toBe(0);
    });

    it("has llmState idle", () => {
      const store = new StageStore(1, noopLlmProvider);
      expect(store.state.llmState).toBe(LlmState.Idle);
    });

    it("has llmCalls 0", () => {
      const store = new StageStore(1, noopLlmProvider);
      expect(store.state.llmCalls).toBe(0);
    });

    it("has llmCompleted 0", () => {
      const store = new StageStore(1, noopLlmProvider);
      expect(store.state.llmCompleted).toBe(0);
    });

    it("stores stageId", () => {
      const store = new StageStore(5, noopLlmProvider);
      expect(store.state.stageId).toBe(5);
    });

    it("has default maxRetries of 3", () => {
      const store = new StageStore(1, noopLlmProvider);
      expect(store.maxRetries).toBe(3);
    });

    it("has default timeoutMs of 120000", () => {
      const store = new StageStore(1, noopLlmProvider);
      expect(store.timeoutMs).toBe(120_000);
    });
  });

  describe("createTestStageStore", () => {
    it("exposes forceState for white-box setup", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Active });
      expect(store.state.stageState).toBe(StageState.Active);
    });
  });

  describe("destroy and reset", () => {
    it("destroy works correctly", () => {
      const store = new StageStore(1, noopLlmProvider);
      store.destroy();
      expect(store.destroyed).toBe(true);
    });

    it("reset returns to initial state", () => {
      const { store } = createTestStageStore();
      store.activate();
      store.reset();
      expect(store.state.stageState).toBe(StageState.Idle);
      expect(store.state.llmCalls).toBe(0);
    });
  });

  describe("activate", () => {
    it("transitions from idle to active", () => {
      const { store } = createTestStageStore();
      const result = store.activate();
      expect(isOk(result)).toBe(true);
      expect(store.state.stageState).toBe(StageState.Active);
    });

    it("fails from non-idle state", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Active });
      const result = store.activate();
      expect(isResultError(result)).toBe(true);
    });
  });

  describe("requestLlm", () => {
    it("transitions from active/idle to requesting with llmCalls incremented", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Active });
      const result = store.requestLlm();
      expect(isOk(result)).toBe(true);
      expect(store.state.llmState).toBe(LlmState.Requesting);
      expect(store.state.llmCalls).toBe(1);
    });

    it("transitions from active/complete to requesting after prior LLM call", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmCalls: 1,
        llmCompleted: 1,
        llmState: LlmState.Complete,
        stageState: StageState.Active,
      });
      const result = store.requestLlm();
      expect(isOk(result)).toBe(true);
      expect(store.state.llmState).toBe(LlmState.Requesting);
    });

    it("fails if stageState is not active", () => {
      const { store } = createTestStageStore();
      const result = store.requestLlm();
      expect(isResultError(result)).toBe(true);
    });

    it("fails if llmState is requesting", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.Requesting,
        stageState: StageState.Active,
      });
      const result = store.requestLlm();
      expect(isResultError(result)).toBe(true);
    });
  });

  describe("handleStreamStart", () => {
    it("transitions from requesting to streaming-active with stageState streaming", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.Requesting,
        stageState: StageState.Active,
      });
      const result = store.handleStreamStart();
      expect(isOk(result)).toBe(true);
      expect(store.state.llmState).toBe(LlmState.StreamingActive);
      expect(store.state.stageState).toBe(StageState.Streaming);
    });

    it("fails if llmState is not requesting", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ llmState: LlmState.Idle, stageState: StageState.Active });
      const result = store.handleStreamStart();
      expect(isResultError(result)).toBe(true);
    });
  });

  describe("handleStreamComplete", () => {
    it("transitions from streaming-active to complete with stageState active and llmCompleted incremented", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.StreamingActive,
        stageState: StageState.Streaming,
      });
      const result = store.handleStreamComplete();
      expect(isOk(result)).toBe(true);
      expect(store.state.llmState).toBe(LlmState.Complete);
      expect(store.state.stageState).toBe(StageState.Active);
      expect(store.state.llmCompleted).toBe(1);
    });

    it("fails if llmState is not streaming-active", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.Requesting,
        stageState: StageState.Active,
      });
      const result = store.handleStreamComplete();
      expect(isResultError(result)).toBe(true);
    });
  });

  describe("full LLM lifecycle", () => {
    it("requestLlm -> handleStreamStart -> handleStreamComplete leaves stage active with llmCompleted 1", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Active });

      const request = store.requestLlm();
      expect(isOk(request)).toBe(true);

      const start = store.handleStreamStart();
      expect(isOk(start)).toBe(true);

      const complete = store.handleStreamComplete();
      expect(isOk(complete)).toBe(true);

      expect(store.state.stageState).toBe(StageState.Active);
      expect(store.state.llmState).toBe(LlmState.Complete);
      expect(store.state.llmCompleted).toBe(1);
      expect(store.state.llmCalls).toBe(1);
    });
  });
});
