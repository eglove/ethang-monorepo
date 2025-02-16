import type { SortDescriptor } from "@heroui/react";

import { userStore } from "@/components/stores/user-store.ts";
import {
  getDatabase,
  JOB_APPLICATION_STORE_NAME,
  QUESTION_ANSWER_STORE_NAME,
} from "@/database/indexed-database.ts";
import { syncUrl } from "@/lib/query/backup.ts";
import { jobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema.ts";
import { questionAnswerSchema } from "@ethang/schemas/src/job-search/question-answer-schema.ts";
import { parseFetchJson } from "@ethang/toolbelt/src/fetch/json.ts";
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
  companyFilter?: string;
  hasInterviewing?: boolean;
  hasNoStatus?: boolean;
  hasRejected?: boolean;
  page?: number;
  sorting?: SortDescriptor;
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
        const application = await database.get(JOB_APPLICATION_STORE_NAME, id);

        if (isNil(application)) {
          const url = new URL("/applications", syncUrl);
          url.searchParams.append("id", id);
          const response = await globalThis.fetch(url, {
            headers: {
              Authorization: userStore.get().token,
              "Content-Type": "application/json",
            },
          });
          const data = await parseFetchJson(response, jobApplicationSchema);

          if (isError(data)) {
            return;
          }

          return data;
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

        if (isEmpty(applications)) {
          const url = new URL("/applications", syncUrl);
          const response = await globalThis.fetch(url, {
            headers: {
              Authorization: userStore.get().token,
              "Content-Type": "application/json",
            },
          });
          const data = await parseFetchJson(
            response,
            z.array(jobApplicationSchema),
          );

          if (!isError(data)) {
            applications = data;
          }
        }

        applications = applications.sort((a, b) => {
          return b.id.localeCompare(a.id);
        });

        let filtered = filter(applications, (item) => {
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
            [filters.sorting.column],
            ["descending" === filters.sorting.direction ? "desc" : "asc"],
          );
        }

        if (isNil(filters?.page)) {
          return filtered;
        }

        const currentPage = APPLICATION_PAGE_SIZE * (filters.page - 1);
        return slice(
          filtered,
          currentPage,
          currentPage + APPLICATION_PAGE_SIZE,
        );
      },
      queryKey: queryKeys.getApplications(filters),
    });
  },
  getQas: () => {
    return queryOptions({
      queryFn: async () => {
        const database = await getDatabase();
        let qas = await database.getAll(QUESTION_ANSWER_STORE_NAME);

        if (isEmpty(qas)) {
          const url = new URL("/question-answers", syncUrl);
          const response = await globalThis.fetch(url, {
            headers: {
              Authorization: userStore.get().token,
              "Content-Type": "application/json",
            },
          });
          console.log(await response.json());
          const data = await parseFetchJson(
            response,
            z.array(questionAnswerSchema),
          );

          if (!isError(data)) {
            qas = data;
          }
        }

        return qas;
      },
      queryKey: queryKeys.getQas(),
    });
  },
};
