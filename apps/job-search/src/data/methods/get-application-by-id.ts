import { setLastSynced, userStore } from "@/components/stores/user-store.ts";
import { queryKeys } from "@/data/queries.ts";
import { syncUrls } from "@/data/urls.ts";
import {
  getDatabase,
  JOB_APPLICATION_STORE_NAME,
} from "@/database/indexed-database.ts";
import { jobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema.ts";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json";
import { queryOptions } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty";
import isError from "lodash/isError";
import isNil from "lodash/isNil";

export const getApplicationById = (id: string | undefined) => {
  return queryOptions({
    enabled: !isEmpty(id),
    queryFn: async () => {
      if (isNil(id)) {
        return null;
      }

      const database = await getDatabase();
      let application = await database.get(JOB_APPLICATION_STORE_NAME, id);
      const store = userStore.get();

      if (isNil(application) && store.isSignedIn) {
        const url = syncUrls.applications;
        url.searchParams.append("id", id);
        const response = await globalThis.fetch(url, {
          headers: {
            Authorization: store.token,
            "Content-Type": "application/json",
          },
        });
        const data = await parseFetchJson(response, jobApplicationSchema);

        if (!isError(data)) {
          setLastSynced();
          application = data;
        }
      }

      return application ?? null;
    },
    queryKey: queryKeys.getApplication(id),
  });
};
