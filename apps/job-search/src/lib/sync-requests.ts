import { queryClient } from "@/components/common/providers";
import { setLastSynced, userStore } from "@/components/stores/user-store.ts";
import { queries, queryKeys } from "@/data/queries";
import {
  getDatabase,
  JOB_APPLICATION_STORE_NAME,
  QUESTION_ANSWER_STORE_NAME,
} from "@/database/indexed-database.ts";
import { syncUrl } from "@/lib/query/backup.ts";
import { jobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema.ts";
import { questionAnswerSchema } from "@ethang/schemas/src/job-search/question-answer-schema.ts";
import { parseFetchJson } from "@ethang/toolbelt/src/fetch/json.ts";
import isError from "lodash/isError.js";
import map from "lodash/map.js";
import { z } from "zod";

export const backupAllData = async () => {
  const userState = userStore.get();

  if (!userState.isSignedIn) {
    return;
  }

  const url = new URL("/data-sync", syncUrl);
  const qas = await queryClient.fetchQuery(queries.getQas());
  const applications = await queryClient.fetchQuery(queries.getApplications());
  await globalThis
    .fetch(url, {
      body: JSON.stringify({ applications, qas }),
      headers: {
        Authorization: userState.token,
        "Content-Type": "application/json",
      },
      method: "POST",
    })
    .then(setLastSynced);
};

export const getAllData = async () => {
  const userState = userStore.get();

  if (!userState.isSignedIn) {
    return;
  }

  const url = new URL("/get-data", syncUrl);
  const response = await globalThis.fetch(url, {
    headers: {
      Authorization: userState.token,
      "Content-Type": "application/json",
    },
  });

  const data = await parseFetchJson(
    response,
    z.object({
      applications: z.array(jobApplicationSchema),
      qas: z.array(questionAnswerSchema),
    }),
  );

  if (isError(data)) {
    throw new Error("Import failed.");
  }

  const database = await getDatabase();

  await Promise.all([
    ...map(data.applications, async (application) => {
      return database.put(JOB_APPLICATION_STORE_NAME, application);
    }),
    ...map(data.qas, async (qa) => {
      return database.put(QUESTION_ANSWER_STORE_NAME, qa);
    }),
    queryClient.invalidateQueries({ queryKey: queryKeys.applications() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.qas() }),
  ]).then(setLastSynced);
};
