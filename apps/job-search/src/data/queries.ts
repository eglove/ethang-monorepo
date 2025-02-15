import type { SortDescriptor } from "@heroui/react";

import {
  getJobApplicationsDatabase,
  getQuestionAnswerDatabase,
  JOB_APPLICATION_STORE_NAME,
  QUESTION_ANSWER_STORE_NAME,
  type QuestionAnswerSchema,
} from "@/database/indexed-database.ts";
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
  getApplicationsLast30Days: () => ["application", "get", "last30Days"],
  getQas: () => ["qa", "get"],
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
        return database.get(JOB_APPLICATION_STORE_NAME, id);
      },
      queryKey: queryKeys.getApplicationKeys(id),
    });
  },
  getApplications: (filters?: ApplicationsFilter) => {
    return queryOptions({
      queryFn: async () => {
        const database = await getJobApplicationsDatabase();
        const applied = await database.getAllFromIndex(
          JOB_APPLICATION_STORE_NAME,
          "applied",
        );

        // eslint-disable-next-line sonar/no-misleading-array-reverse
        const data = applied.sort((a, b) => {
          return b.id.localeCompare(a.id);
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
        const database = await getQuestionAnswerDatabase();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        return database.getAll(
          QUESTION_ANSWER_STORE_NAME,
        ) as unknown as Promise<QuestionAnswerSchema[]>;
      },
      queryKey: queryKeys.getQas(),
    });
  },
};
