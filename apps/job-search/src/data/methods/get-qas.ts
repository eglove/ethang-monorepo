import { setLastSynced, userStore } from "@/components/stores/user-store.ts";
import { queryKeys } from "@/data/queries.ts";
import { syncUrls } from "@/data/urls.ts";
import {
  getDatabase,
  QUESTION_ANSWER_STORE_NAME,
} from "@/database/indexed-database.ts";
import { questionAnswerSchema } from "@ethang/schemas/src/job-search/question-answer-schema.ts";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json";
import { queryOptions } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty";
import isError from "lodash/isError";
import { z } from "zod";

export const getQas = () => {
  return queryOptions({
    queryFn: async () => {
      const database = await getDatabase();
      let qas = await database.getAll(QUESTION_ANSWER_STORE_NAME);
      const store = userStore.get();

      if (isEmpty(qas) && store.isSignedIn) {
        const response = await globalThis.fetch(syncUrls.qas, {
          headers: {
            Authorization: store.token,
            "Content-Type": "application/json",
          },
        });
        const data = await parseFetchJson(
          response,
          z.array(questionAnswerSchema),
        );

        if (!isError(data)) {
          qas = data;
          setLastSynced();
        }
      }

      return qas;
    },
    queryKey: queryKeys.getQas(),
  });
};
