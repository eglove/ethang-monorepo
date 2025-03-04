import type { JobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema.ts";

import { queryClient } from "@/components/common/providers.tsx";
import { setLastSynced, userStore } from "@/components/stores/user-store.ts";
import { queryKeys } from "@/data/queries.ts";
import { syncUrls } from "@/data/urls.ts";
import {
  getDatabase,
  JOB_APPLICATION_STORE_NAME,
} from "@/database/indexed-database.ts";
import { logger } from "@/lib/logger.ts";

export const addJobApplication = async (application: JobApplicationSchema) => {
  const user = userStore.get();
  if (user.isSignedIn) {
    globalThis
      .fetch(syncUrls.applications, {
        body: JSON.stringify(application),
        headers: {
          Authorization: user.token,
          "Content-Type": "application/json",
        },
        method: "POST",
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
  const value = await database.add(JOB_APPLICATION_STORE_NAME, application);
  await queryClient.invalidateQueries({ queryKey: queryKeys.applications() });
  return value;
};
