import { getJobApplicationsDatabase } from "@/database/indexed-database.ts";
import { queryOptions } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";

export const queryKeys = {
  applications: () => ["application"],
  getApplicationKeys: (id: string | undefined) => ["application", "get", id],
  getApplications: () => ["application", "get"],
};

export const queries = {
  getApplicationById: (id: string | undefined) => {
    return queryOptions({
      enabled: !isEmpty(id),
      queryFn: async () => {
        if (isNil(id)) {
          return;
        }

        const database = await getJobApplicationsDatabase();
        return database.get("jobApplications", id);
      },
      queryKey: queryKeys.getApplicationKeys(id),
    });
  },
  getApplications: () => {
    return queryOptions({
      queryFn: async () => {
        const database = await getJobApplicationsDatabase();
        const applied = await database.getAllFromIndex(
          "jobApplications",
          "applied",
        );

        return applied.sort((a, b) => {
          if (isNil(a.updated) || isNil(b.updated)) {
            return Number.NEGATIVE_INFINITY;
          }

          return b.updated.getTime() - a.updated.getTime();
        });
      },
      queryKey: queryKeys.getApplications(),
    });
  },
};
