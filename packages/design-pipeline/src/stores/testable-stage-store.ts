import assign from "lodash/assign.js";
import constant from "lodash/constant.js";

import type { LlmProvider } from "../util/interfaces.ts";

import { ok } from "../util/result.ts";
import { StageStore, type StageStoreState } from "./stage-store.ts";

export type TestStageStore = {
  forceState: (state: Partial<StageStoreState>) => void;
  store: TestableStageStore;
};

export class TestableStageStore extends StageStore {
  public forceState(partial: Partial<StageStoreState>): void {
    this.update((draft) => {
      assign(draft, partial);
    });
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
async function* noopStream() {
  yield { content: "", done: true };
}

const noopLlmProvider: LlmProvider = {
  // eslint-disable-next-line @typescript-eslint/require-await
  chat: async () => ok(noopStream()),
  getModel: constant("test-model"),
};

export const createTestStageStore = (
  stageId = 1,
  llmProvider: LlmProvider = noopLlmProvider,
): TestStageStore => {
  const store = new TestableStageStore(stageId, llmProvider);

  return {
    forceState: (partial: Partial<StageStoreState>) => {
      store.forceState(partial);
    },
    store,
  };
};
