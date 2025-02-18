import type {
  ApplicationTableFilter,
  Sorting,
} from "@/components/job-tracker/table-state.ts";

import { setLastSynced, userStore } from "@/components/stores/user-store.ts";
import {
  getDatabase,
  JOB_APPLICATION_STORE_NAME,
  QUESTION_ANSWER_STORE_NAME,
} from "@/database/indexed-database.ts";
import { syncUrl } from "@/lib/query/backup.ts";
import { jobApplicationSchema } from "@ethang/schemas/job-search/job-application-schema.js";
import { questionAnswerSchema } from "@ethang/schemas/job-search/question-answer-schema.js";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json.js";
import { queryOptions } from "@tanstack/react-query";
import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import isEmpty from "lodash/isEmpty";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil";
import isString from "lodash/isString.js";
import orderBy from "lodash/orderBy.js";
import slice from "lodash/slice.js";
import toLower from "lodash/toLower.js";
import { z } from "zod";

type ApplicationsFilter = {
  page?: number;
  search?: string;
  sorting?: Sorting;
  tableFilters?: ApplicationTableFilter;
};

export const APPLICATION_PAGE_SIZE = 10;

export const queryKeys = {
  applications: () => ["application"],
  getApplicationKeys: (id: string | undefined) => ["application", "get", id],
  getApplications: (_filter?: ApplicationsFilter) => [
    "application",
    "get",
    _filter,
  ],
  getQas: () => ["qa", "get"],
  qas: () => ["qa"],
};

export const queries = {
  getApplicationById: (id: string | undefined) => {
    return queryOptions({
      enabled: !isEmpty(id),
      queryFn: async () => {
        if (isNil(id)) {
          return;
        }

        const database = await getDatabase();
        let application = await database.get(JOB_APPLICATION_STORE_NAME, id);
        const store = userStore.get();

        if (isNil(application) && store.isSignedIn) {
          const url = new URL("/applications", syncUrl);
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

        return application;
      },
      queryKey: queryKeys.getApplicationKeys(id),
    });
  },
  getApplications: (filters?: ApplicationsFilter) => {
    return queryOptions({
      queryFn: async () => {
        const database = await getDatabase();
        let applications = await database.getAllFromIndex(
          JOB_APPLICATION_STORE_NAME,
          "applied",
        );
        const store = userStore.get();

        if (isEmpty(applications) && store.isSignedIn) {
          const url = new URL("/applications", syncUrl);
          const response = await globalThis.fetch(url, {
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
          return String(b.id).localeCompare(String(a.id));
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
              condition =
                !isEmpty(item.interviewRounds) || !isNil(item.rejected);
            }
          }

          if (
            condition &&
            !isNil(filters?.search) &&
            !isEmpty(filters.search)
          ) {
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
  },
  getQas: () => {
    return queryOptions({
      queryFn: async () => {
        const database = await getDatabase();
        let qas = await database.getAll(QUESTION_ANSWER_STORE_NAME);
        const store = userStore.get();

        if (isEmpty(qas) && store.isSignedIn) {
          const url = new URL("/question-answers", syncUrl);
          const response = await globalThis.fetch(url, {
            headers: {
              Authorization: store.token,
              "Content-Type": "application/json",
            },
          });
          const data = await parseFetchJson(
            response,
            z.array(questionAnswerSchema),
          );

          if (!isError(data)) {
            qas = data;
            setLastSynced();
          }
        }

        return qas;
      },
      queryKey: queryKeys.getQas(),
    });
  },
};
