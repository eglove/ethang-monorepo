import {
  type CreateQuestionAnswer,
  type QuestionAnswer,
  questionAnswerSchema,
} from "@ethang/schemas/dashboard/question-answer-schema.ts";
import { BaseStore } from "@ethang/store";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json";
import { queryOptions } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty";
import isError from "lodash/isError";
import { z } from "zod";

import { queryClient } from "../components/providers.tsx";
import { queryKeys } from "../data/queries/queries.ts";
import { authStore } from "./auth-store.ts";

const defaultState = {
  isCreateModalOpen: false,
  isUpdateModalOpen: false,
  qaToUpdate: null as null | QuestionAnswer,
};

type QaStoreState = typeof defaultState;
const questionAnswerPath = "/api/question-answer";

export class QaStore extends BaseStore<QaStoreState> {
  public constructor() {
    super(defaultState);
  }

  public createQa(userId = "") {
    return {
      mutationFn: async (data: CreateQuestionAnswer) => {
        const response = await fetch(questionAnswerPath, {
          body: JSON.stringify(data),
          method: "POST",
        });

        if (response.ok) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allUserQuestionAnswers(userId),
          });

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
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allUserQuestionAnswers(userId),
          });

          onOk?.();
        }
      },
    };
  }

  public getAll(userId = "") {
    return queryOptions({
      enabled: !isEmpty(userId),
      queryFn: async () => {
        if (isEmpty(userId)) {
          throw new Error("No user found");
        }

        const response = await fetch(questionAnswerPath);

        if (401 === response.status) {
          authStore.signOut();
          throw new Error("Unauthorized");
        }

        const data = await parseFetchJson(
          response,
          z.array(questionAnswerSchema),
        );

        if (isError(data)) {
          throw new Error("Failed to fetch question answers");
        }

        return data;
      },
      queryKey: queryKeys.questionAnswers(userId),
    });
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

  public setQaToUpdate = (qa: null | QuestionAnswer) => {
    this.update((draft) => {
      draft.qaToUpdate = qa;
    });
  };

  public updateQa(userId = "") {
    return {
      mutationFn: async (qa: QuestionAnswer) => {
        const response = await fetch(questionAnswerPath, {
          body: JSON.stringify({ ...qa, userId }),
          method: "PUT",
        });

        if (response.ok) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allUserQuestionAnswers(userId),
          });

          this.update((draft) => {
            draft.isUpdateModalOpen = false;
          }, false);
        }
      },
    };
  }
}

export const qaStore = new QaStore();
