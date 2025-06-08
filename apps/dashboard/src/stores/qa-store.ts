import {
  type CreateQuestionAnswer,
  type QuestionAnswer,
  questionAnswerSchema,
} from "@ethang/schemas/src/dashboard/question-answer-schema.ts";
import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import { queryOptions } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty";
import isError from "lodash/isError";
import { z } from "zod";

import { queryClient } from "../components/providers.tsx";
import { queryKeys } from "../data/queries/queries.ts";
import { BaseStore, useStore } from "./base-store.ts";

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

          qaStore.setIsCreateModalOpen(false);
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

        const data = await fetchJson(
          questionAnswerPath,
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

          qaStore.setIsUpdateModalOpen(false);
        }
      },
    };
  }
}

export const qaStore = new QaStore();

export const useQaStore = <Selection>(
  selector: (snapshot: QaStore["state"]) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean,
) => {
  return useStore(qaStore, selector, isEqual);
};
