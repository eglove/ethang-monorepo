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

describe("StageStore base", () => {
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

    it("has llmCalls and llmCompleted 0", () => {
      const store = new StageStore(1, noopLlmProvider);
      expect(store.state.llmCalls).toBe(0);
      expect(store.state.llmCompleted).toBe(0);
    });

    it("has stageDestroyed false", () => {
      const store = new StageStore(1, noopLlmProvider);
      expect(store.state.stageDestroyed).toBe(false);
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
      expect(isOk(store.activate())).toBe(true);
      expect(store.state.stageState).toBe(StageState.Active);
    });

    it("fails from non-idle state", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Active });
      expect(isResultError(store.activate())).toBe(true);
    });
  });

  describe("LLM lifecycle", () => {
    it("requestLlm from active/idle -> requesting", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Active });
      expect(isOk(store.requestLlm())).toBe(true);
      expect(store.state.llmState).toBe(LlmState.Requesting);
      expect(store.state.llmCalls).toBe(1);
    });

    it("requestLlm from active/complete -> requesting", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmCalls: 1,
        llmCompleted: 1,
        llmState: LlmState.Complete,
        stageState: StageState.Active,
      });
      expect(isOk(store.requestLlm())).toBe(true);
    });

    it("requestLlm fails if not active", () => {
      const { store } = createTestStageStore();
      expect(isResultError(store.requestLlm())).toBe(true);
    });

    it("handleStreamStart from requesting -> streaming-active", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.Requesting,
        stageState: StageState.Active,
      });
      expect(isOk(store.handleStreamStart())).toBe(true);
      expect(store.state.llmState).toBe(LlmState.StreamingActive);
      expect(store.state.stageState).toBe(StageState.Streaming);
    });

    it("handleStreamComplete from streaming-active -> complete", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.StreamingActive,
        stageState: StageState.Streaming,
      });
      expect(isOk(store.handleStreamComplete())).toBe(true);
      expect(store.state.llmState).toBe(LlmState.Complete);
      expect(store.state.stageState).toBe(StageState.Active);
      expect(store.state.llmCompleted).toBe(1);
    });

    it("full cycle: request -> stream -> complete", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Active });
      expect(isOk(store.requestLlm())).toBe(true);
      expect(isOk(store.handleStreamStart())).toBe(true);
      expect(isOk(store.handleStreamComplete())).toBe(true);
      expect(store.state.stageState).toBe(StageState.Active);
      expect(store.state.llmCompleted).toBe(1);
    });
  });
});
