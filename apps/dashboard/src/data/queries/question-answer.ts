import { questionAnswerSchema } from "@ethang/schemas/src/dashboard/question-answer-schema.ts";
import { createUrl } from "@ethang/toolbelt/fetch/create-url";
import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import { queryOptions } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import isError from "lodash/isError";
import { z } from "zod";

import { queryKeys } from "./queries.ts";

export const getQuestionAnswers = (userId = "") => {
  return queryOptions({
    enabled: !isEmpty(userId),
    queryFn: async () => {
      if (isEmpty(userId)) {
        throw new Error("No user found");
      }

      const url = createUrl("/api/question-answer", {
        searchParamsSchema: z.object({
          filterBy: z.string().optional(),
        }),
        urlBase: globalThis.location.origin,
      });

      if (isError(url)) {
        throw new Error("Failed to create url");
      }

      const data = await fetchJson(url, z.array(questionAnswerSchema));

      if (isError(data)) {
        throw new Error("Failed to fetch question answers");
      }

      return data;
    },
    queryKey: queryKeys.questionAnswers(userId),
  });
};
