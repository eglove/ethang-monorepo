import assign from "lodash/assign.js";

import {
  type OrchestratorState,
  OrchestratorStore,
} from "./orchestrator-store.ts";

export type TestOrchestratorStore = {
  forceState: (state: Partial<OrchestratorState>) => void;
  store: TestableOrchestratorStore;
};

export class TestableOrchestratorStore extends OrchestratorStore {
  public forceState(partial: Partial<OrchestratorState>): void {
    this.update((draft) => {
      assign(draft, partial);
    });
  }
}

export const createTestOrchestratorStore = (
  numberStages = 3,
): TestOrchestratorStore => {
  const store = new TestableOrchestratorStore(numberStages);

  return {
    forceState: (partial: Partial<OrchestratorState>) => {
      store.forceState(partial);
    },
    store,
  };
};
