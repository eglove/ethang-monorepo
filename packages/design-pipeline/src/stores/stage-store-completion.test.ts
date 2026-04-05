import { describe, expect, it } from "vitest";

import { LlmState, StageState } from "../util/enums.ts";
import { isOk, isResultError } from "../util/result.ts";
import { createTestStageStore } from "./testable-stage-store.ts";

describe("StageStore completion", () => {
  describe("decideComplete", () => {
    it("after one LLM cycle -> complete", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmCompleted: 1,
        llmState: LlmState.Complete,
        stageState: StageState.Active,
      });
      expect(isOk(store.decideComplete())).toBe(true);
      expect(store.state.stageState).toBe(StageState.Complete);
    });

    it("with in-flight LLM -> err", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmCompleted: 1,
        llmState: LlmState.Requesting,
        stageState: StageState.Active,
      });
      expect(isResultError(store.decideComplete())).toBe(true);
    });

    it("with llmCompleted 0 -> err", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ llmState: LlmState.Idle, stageState: StageState.Active });
      expect(isResultError(store.decideComplete())).toBe(true);
    });

    it("multi-LLM cycle succeeds with llmCompleted 2", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Active });

      store.requestLlm();
      store.handleStreamStart();
      store.handleStreamComplete();
      store.requestLlm();
      store.handleStreamStart();
      store.handleStreamComplete();

      expect(isOk(store.decideComplete())).toBe(true);
      expect(store.state.llmCompleted).toBe(2);
    });
  });

  describe("completeDirectly", () => {
    it("from active with no LLM calls -> complete", () => {
      const { forceState, store } = createTestStageStore();
      forceState({ stageState: StageState.Active });
      expect(isOk(store.completeDirectly())).toBe(true);
      expect(store.state.stageState).toBe(StageState.Complete);
    });

    it("with llmCompleted > 0 -> err", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmCompleted: 1,
        llmState: LlmState.Complete,
        stageState: StageState.Active,
      });
      expect(isResultError(store.completeDirectly())).toBe(true);
    });

    it("with in-flight LLM -> err", () => {
      const { forceState, store } = createTestStageStore();
      forceState({
        llmState: LlmState.Requesting,
        stageState: StageState.Active,
      });
      expect(isResultError(store.completeDirectly())).toBe(true);
    });
  });
});
