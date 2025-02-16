import type { mutationMetaTypes } from "@/data/mutations.ts";

import { userStore } from "@/components/stores/user-store.ts";
import { questionAnswerSchema } from "@ethang/schemas/src/job-search/question-answer-schema.ts";
import { MutationCache } from "@tanstack/react-query";
import get from "lodash/get";

const syncUrl = "https://job-search-sync.ethang.dev";

export const mutationCache = new MutationCache({
  onSuccess: async (data, variables, _, mutation) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const type = get(mutation, ["meta", "type"]) as
      | (typeof mutationMetaTypes)[keyof typeof mutationMetaTypes]
      | undefined;

    if ("updateQa" === type) {
      const body = questionAnswerSchema.safeParse(variables);

      if (!body.success) {
        return data;
      }

      const url = new URL("/question-answers", syncUrl);
      await globalThis.fetch(url, {
        body: JSON.stringify(body.data),
        headers: {
          Authorization: userStore.get().token,
          "Content-Type": "application/json",
        },
        method: "PUT",
      });
    }

    return data;
  },
});
