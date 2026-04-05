import { describe, expect, it } from "vitest";

import { RunState } from "../util/enums.ts";
import { isOk, isResultError } from "../util/result.ts";
import { OrchestratorStore } from "./orchestrator-store.ts";
import { createTestOrchestratorStore } from "./testable-orchestrator-store.ts";

describe("OrchestratorStore", () => {
  describe("initial state", () => {
    it("has runState idle", () => {
      const store = new OrchestratorStore(3);
      expect(store.state.runState).toBe(RunState.Idle);
    });

    it("has currentStage 0", () => {
      const store = new OrchestratorStore(3);
      expect(store.state.currentStage).toBe(0);
    });

    it("all stageCreated entries are false", () => {
      const store = new OrchestratorStore(3);
      expect(store.state.stageCreated[1]).toBe(false);
      expect(store.state.stageCreated[2]).toBe(false);
      expect(store.state.stageCreated[3]).toBe(false);
    });

    it("all stageDestroyed entries are false", () => {
      const store = new OrchestratorStore(3);
      expect(store.state.stageDestroyed[1]).toBe(false);
      expect(store.state.stageDestroyed[2]).toBe(false);
      expect(store.state.stageDestroyed[3]).toBe(false);
    });

    it("subscriptions is empty", () => {
      const store = new OrchestratorStore(3);
      expect(store.state.subscriptions).toStrictEqual([]);
    });
  });

  describe("createTestOrchestratorStore", () => {
    it("exposes forceState that sets arbitrary state", () => {
      const { forceState, store } = createTestOrchestratorStore(3);
      forceState({ currentStage: 2, runState: RunState.Running });
      expect(store.state.runState).toBe(RunState.Running);
      expect(store.state.currentStage).toBe(2);
    });
  });

  describe("destroy", () => {
    it("destroys without error", () => {
      const store = new OrchestratorStore(3);
      store.destroy();
      expect(store.destroyed).toBe(true);
    });
  });

  describe("reset", () => {
    it("returns to initial state", () => {
      const { store } = createTestOrchestratorStore(3);
      store.start();
      store.reset();
      expect(store.state.runState).toBe(RunState.Idle);
      expect(store.state.currentStage).toBe(0);
    });
  });

  describe("start", () => {
    it("transitions from idle to running with currentStage 1 and stageCreated[1] true", () => {
      const store = new OrchestratorStore(3);
      const result = store.start();
      expect(isOk(result)).toBe(true);
      expect(store.state.runState).toBe(RunState.Running);
      expect(store.state.currentStage).toBe(1);
      expect(store.state.stageCreated[1]).toBe(true);
    });

    it("returns error when called from non-idle state", () => {
      const { forceState, store } = createTestOrchestratorStore(3);
      forceState({ runState: RunState.Running });
      const result = store.start();
      expect(isResultError(result)).toBe(true);
    });

    it("returns error on second call", () => {
      const store = new OrchestratorStore(3);
      store.start();
      const result = store.start();
      expect(isResultError(result)).toBe(true);
    });
  });
});
