import { userStore } from "@/components/stores/user-store.ts";
import { queryKeys } from "@/data/queries.ts";
import { syncUrls } from "@/data/urls.ts";
import { statsSchema } from "@ethang/schemas/src/job-search/stats.ts";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json.js";
import { queryOptions } from "@tanstack/react-query";
import isError from "lodash/isError.js";

export const getUserStats = () => {
  return queryOptions({
    queryFn: async () => {
      const user = userStore.get();

      if (!user.isSignedIn) {
        return;
      }

      const response = await globalThis.fetch(syncUrls.userStats, {
        headers: {
          Authorization: user.token,
          "Content-Type": "application/json",
        },
      });

      if (401 === response.status) {
        userStore.set((state) => {
          state.isSignedIn = false;
        });
        return;
      }

      if (!response.ok) {
        return;
      }

      const data = await parseFetchJson(response, statsSchema);

      if (isError(data)) {
        return;
      }

      return data;
    },
    queryKey: queryKeys.statsUser(),
  });
};
