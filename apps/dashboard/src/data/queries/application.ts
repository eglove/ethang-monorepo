import { getAllApplicationsSchema } from "@ethang/schemas/src/dashboard/application-schema.ts";
import { createUrl } from "@ethang/toolbelt/fetch/create-url";
import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import isError from "lodash/isError";
import convertToString from "lodash/toString";
import { z } from "zod";

import { queryKeys } from "./queries.ts";

export const getApplications = (userId = "", page = 1, search = "") => {
  return queryOptions({
    enabled: !isEmpty(userId),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (isEmpty(userId)) {
        throw new Error("No user found");
      }

      const url = createUrl("/api/application", {
        searchParams: { page: convertToString(page), search },
        searchParamsSchema: z.object({
          page: z.string().optional(),
          search: z.string().optional(),
        }),
        urlBase: globalThis.location.origin,
      });

      if (isError(url)) {
        throw new Error("Failed to create url");
      }

      const data = await fetchJson(url, getAllApplicationsSchema);

      if (isError(data)) {
        throw new Error("Failed to fetch applications");
      }

      return data;
    },
    queryKey: queryKeys.applications(userId, page, search),
  });
};
