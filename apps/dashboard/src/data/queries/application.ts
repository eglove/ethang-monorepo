import { applicationSchema } from "@ethang/schemas/src/dashboard/application-schema.ts";
import { createUrl } from "@ethang/toolbelt/fetch/create-url";
import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import { queryOptions } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import isError from "lodash/isError";
import { z } from "zod";

import { getToken } from "../../utilities/token.ts";
import { type Filters, queryKeys } from "./queries.ts";

export const getApplications = (userId = "", filters?: Filters) => {
  return queryOptions({
    enabled: !isEmpty(userId),
    queryFn: async () => {
      if (isEmpty(userId)) {
        throw new Error("No user found");
      }

      const url = createUrl("/api/application", {
        searchParams: { ...filters },
        searchParamsSchema: z.object({
          filterBy: z.string().optional(),
        }),
        urlBase: globalThis.location.origin,
      });

      if (isError(url)) {
        throw new Error("Failed to create url");
      }

      const data = await fetchJson(
        new Request(url, {
          headers: { Authorization: getToken() },
        }),
        z.array(applicationSchema),
      );

      if (isError(data)) {
        throw new Error("Failed to fetch applications");
      }

      return data;
    },
    queryKey: queryKeys.applications(userId, filters),
  });
};
