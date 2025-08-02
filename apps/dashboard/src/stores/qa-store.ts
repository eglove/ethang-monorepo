import type { CreateQuestionAnswer } from "@ethang/schemas/dashboard/question-answer-schema.ts";

import { BaseStore } from "@ethang/store";

import type { FetchedQuestionAnswer } from "../graphql/queries/get-all-question-answers.ts";

const defaultState = {
  isCreateModalOpen: false,
  isUpdateModalOpen: false,
  qaToUpdate: null as FetchedQuestionAnswer | null,
};

type QaStoreState = typeof defaultState;
const questionAnswerPath = "/api/question-answer";

export class QaStore extends BaseStore<QaStoreState> {
  public constructor() {
    super(defaultState);
  }

  public createQa() {
    return {
      mutationFn: async (data: CreateQuestionAnswer) => {
        const response = await fetch(questionAnswerPath, {
          body: JSON.stringify(data),
          method: "POST",
        });

        if (response.ok) {
          this.update((draft) => {
            draft.isCreateModalOpen = false;
          }, false);
        }
      },
    };
  }

  public deleteQa(userId = "", onOk?: () => void) {
    return {
      mutationFn: async (id: string) => {
        const response = await globalThis.fetch(questionAnswerPath, {
          body: JSON.stringify({
            id,
            userId,
          }),
          method: "DELETE",
        });

        if (response.ok) {
          onOk?.();
        }
      },
    };
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

  public updateQa(userId = "") {
    return {
      mutationFn: async (qa: FetchedQuestionAnswer) => {
        const response = await fetch(questionAnswerPath, {
          body: JSON.stringify({ ...qa, userId }),
          method: "PUT",
        });

        if (response.ok) {
          this.update((draft) => {
            draft.isUpdateModalOpen = false;
          }, false);
        }
      },
    };
  }
}

export const qaStore = new QaStore();
