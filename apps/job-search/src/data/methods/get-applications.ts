import { jobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema.ts";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json";
import { queryOptions } from "@tanstack/react-query";
import filter from "lodash/filter";
import includes from "lodash/includes";
import isEmpty from "lodash/isEmpty";
import isError from "lodash/isError";
import isNil from "lodash/isNil";
import isString from "lodash/isString";
import orderBy from "lodash/orderBy";
import slice from "lodash/slice";
import toLower from "lodash/toLower";
import { z } from "zod";

import type {
  ApplicationTableFilter,
  Sorting,
} from "@/components/job-tracker/table-state.ts";

import { setLastSynced, userStore } from "@/components/stores/user-store.ts";
import { APPLICATION_PAGE_SIZE, queryKeys } from "@/data/queries.ts";
import { syncUrls } from "@/data/urls.ts";
import {
  getDatabase,
  JOB_APPLICATION_STORE_NAME,
} from "@/database/indexed-database.ts";

export type ApplicationsFilter = {
  page?: number;
  search?: string;
  sorting?: Sorting;
  tableFilters?: ApplicationTableFilter;
};

export const getApplications = (filters?: ApplicationsFilter) => {
  return queryOptions({
    queryFn: async () => {
      const database = await getDatabase();
      let applications = await database.getAllFromIndex(
        JOB_APPLICATION_STORE_NAME,
        "applied",
      );
      const store = userStore.get();

      if (isEmpty(applications) && store.isSignedIn) {
        const response = await globalThis.fetch(syncUrls.applications, {
          headers: {
            Authorization: store.token,
            "Content-Type": "application/json",
          },
        });
        const data = await parseFetchJson(
          response,
          z.array(jobApplicationSchema),
        );

        if (!isError(data)) {
          applications = data;
          setLastSynced();
        }
      }

      applications = applications.sort((a, b) => {
        return b.id.localeCompare(a.id);
      });

      let filtered = filter(applications, (item) => {
        let condition = true;

        if (!isEmpty(filters?.tableFilters)) {
          if (!includes(filters?.tableFilters, "interviewing")) {
            condition = isEmpty(item.interviewRounds);
          }

          if (condition && !includes(filters?.tableFilters, "rejected")) {
            condition = isNil(item.rejected);
          }

          if (condition && !includes(filters?.tableFilters, "noStatus")) {
            condition = !isEmpty(item.interviewRounds) || !isNil(item.rejected);
          }
        }

        if (condition && !isNil(filters?.search) && !isEmpty(filters.search)) {
          condition =
            includes(toLower(item.company), toLower(filters.search)) ||
            includes(toLower(item.title), toLower(filters.search));
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
        return { applications: filtered, total: filtered.length };
      }

      const currentPage = APPLICATION_PAGE_SIZE * (filters.page - 1);
      return {
        applications: slice(
          filtered,
          currentPage,
          currentPage + APPLICATION_PAGE_SIZE,
        ),
        total: filtered.length,
      };
    },
    queryKey: queryKeys.getApplications(filters),
  });
};
