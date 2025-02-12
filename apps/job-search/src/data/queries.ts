import type { Sorting } from "@/components/job-tracker/table-state.ts";

import { getJobApplicationsDatabase } from "@/database/indexed-database.ts";
import { queryOptions } from "@tanstack/react-query";
import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";
import isString from "lodash/isString.js";
import orderBy from "lodash/orderBy.js";
import slice from "lodash/slice.js";
import toLower from "lodash/toLower.js";

type ApplicationsFilter = {
  companyFilter?: string;
  hasInterviewing?: boolean;
  hasNoStatus?: boolean;
  hasRejected?: boolean;
  page?: number;
  sorting?: Sorting;
};

export const queryKeys = {
  applications: () => ["application"],
  getApplicationKeys: (id: string | undefined) => ["application", "get", id],
  getApplications: (_filter?: ApplicationsFilter) => [
    "application",
    "get",
    _filter,
  ],
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
  getApplications: (filters?: ApplicationsFilter) => {
    return queryOptions({
      queryFn: async () => {
        const database = await getJobApplicationsDatabase();
        const applied = await database.getAllFromIndex(
          "jobApplications",
          "applied",
        );

        // eslint-disable-next-line sonar/no-misleading-array-reverse
        const data = applied.sort((a, b) => {
          if (isNil(a.updated) || isNil(b.updated)) {
            return Number.NEGATIVE_INFINITY;
          }

          return b.updated.getTime() - a.updated.getTime();
        });

        let filtered = filter(data, (item) => {
          let condition = true;

          if (false === filters?.hasInterviewing) {
            condition = isEmpty(item.interviewRounds);
          }

          if (condition && false === filters?.hasRejected) {
            condition = isNil(item.rejected);
          }

          if (condition && false === filters?.hasNoStatus) {
            condition = !isEmpty(item.interviewRounds) || !isNil(item.rejected);
          }

          if (
            condition &&
            !isNil(filters?.companyFilter) &&
            !isEmpty(filters.companyFilter)
          ) {
            condition = includes(
              toLower(item.company),
              toLower(filters.companyFilter),
            );
          }

          return condition;
        });

        if (isString(filters?.sorting?.direction)) {
          filtered = orderBy(
            filtered,
            [filters.sorting.id],
            [filters.sorting.direction],
          );
        }

        if (isNil(filters?.page)) {
          return filtered;
        }

        const pageSize = 5;
        const currentPage = pageSize * (filters.page - 1);
        return slice(filtered, currentPage, currentPage + pageSize);
      },
      queryKey: queryKeys.getApplications(filters),
    });
  },
};
