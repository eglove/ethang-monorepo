import { setLastSynced, userStore } from "@/components/stores/user-store.ts";
import { logger } from "@/lib/logger.ts";
import { jobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema.ts";
import { questionAnswerSchema } from "@ethang/schemas/src/job-search/question-answer-schema.ts";
import { z } from "zod";

export const syncUrl = "https://job-search-sync.ethang.dev";

type UpsertProperties = {
  method: "POST" | "PUT";
  path: "/applications" | "/question-answers";
  variables: unknown;
};

export const upsert = ({ method, path, variables }: UpsertProperties) => {
  const body =
    "/question-answers" === path
      ? questionAnswerSchema.safeParse(variables)
      : jobApplicationSchema.safeParse(variables);

  if (!body.success) {
    logger.error({ error: body.error, variables });
    return;
  }

  const url = new URL(path, syncUrl);
  globalThis
    .fetch(url, {
      body: JSON.stringify(body.data),
      headers: {
        Authorization: userStore.get().token,
        "Content-Type": "application/json",
      },
      method,
    })
    .then(setLastSynced)
    .catch(logger.error);
};

export const deleteItem = (variables: unknown) => {
  const body = z.string().safeParse(variables);

  if (!body.success) {
    logger.error({ error: body.error, variables });
    return;
  }

  const url = new URL("/question-answers", syncUrl);
  globalThis
    .fetch(url, {
      body: JSON.stringify({ id: body.data }),
      headers: {
        Authorization: userStore.get().token,
      },
      method: "DELETE",
    })
    .then(setLastSynced)
    .catch(logger.error);
};
