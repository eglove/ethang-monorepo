import type { JobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema.ts";

import filter from "lodash/filter";
import isNil from "lodash/isNil";

import { queryClient } from "@/components/common/providers.tsx";
import { setLastSynced, userStore } from "@/components/stores/user-store.ts";
import { queryKeys } from "@/data/queries.ts";
import { syncUrls } from "@/data/urls.ts";
import {
  getDatabase,
  JOB_APPLICATION_STORE_NAME,
} from "@/database/indexed-database.ts";
import { logger } from "@/lib/logger.ts";

export const updateJobApplication = async (
  application: JobApplicationSchema,
) => {
  const user = userStore.get();
  if (user.isSignedIn) {
    globalThis
      .fetch(syncUrls.applications, {
        body: JSON.stringify(application),
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
  const result = await database.put(JOB_APPLICATION_STORE_NAME, {
    ...application,
    interviewRounds: filter(
      application.interviewRounds,
      (value) => !isNil(value),
    ),
  });
  await queryClient.invalidateQueries({ queryKey: queryKeys.applications() });
  return result;
};
