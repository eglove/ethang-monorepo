import { BaseStore } from "@ethang/store";

import type { FetchedQuestionAnswer } from "../graphql/queries/get-all-question-answers.ts";

const defaultState = {
  isCreateModalOpen: false,
  isUpdateModalOpen: false,
  qaToUpdate: null as FetchedQuestionAnswer | null,
};

type QaStoreState = typeof defaultState;

export class QaStore extends BaseStore<QaStoreState> {
  public constructor() {
    super(defaultState);
  }

  public setIsCreateModalOpen = (isOpen: boolean) => {
    this.update((draft) => {
      draft.isCreateModalOpen = isOpen;
    });
  };

  public setIsUpdateModalOpen = (isOpen: boolean) => {
    this.update((draft) => {
      draft.isUpdateModalOpen = isOpen;
    });
  };

  public setQaToUpdate = (qa: FetchedQuestionAnswer | null) => {
    this.update((draft) => {
      draft.qaToUpdate = qa;
    });
  };
}

export const qaStore = new QaStore();
