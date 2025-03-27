import type { QuestionAnswerSchema } from "@ethang/schemas/src/job-search/question-answer-schema.ts";

import { queryClient } from "@/components/common/providers.tsx";
import { setLastSynced, userStore } from "@/components/stores/user-store.ts";
import { queryKeys } from "@/data/queries.ts";
import { syncUrls } from "@/data/urls.ts";
import {
  getDatabase,
  QUESTION_ANSWER_STORE_NAME,
} from "@/database/indexed-database.ts";
import { logger } from "@/lib/logger.ts";

export const updateQa = async (qa: QuestionAnswerSchema) => {
  const user = userStore.get();
  if (user.isSignedIn) {
    globalThis
      .fetch(syncUrls.qas, {
        body: JSON.stringify(qa),
        headers: {
          Authorization: user.token,
          "Content-Type": "application/json",
        },
        method: "PUT",
      })
      .then((response) => {
        if (response.ok) {
          setLastSynced();
        }

        if (401 === response.status) {
          userStore.set((state) => {
            state.isSignedIn = false;
          });
        }
      })
      .catch(logger.error);
  }

  const database = await getDatabase();
  const result = await database.put(QUESTION_ANSWER_STORE_NAME, qa);
  await queryClient.invalidateQueries({ queryKey: queryKeys.qas() });
  return result;
};
