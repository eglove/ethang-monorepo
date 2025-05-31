import { userStatsSchema } from "@ethang/schemas/src/dashboard/stats-schema.ts";
import { createUrl } from "@ethang/toolbelt/fetch/create-url";
import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import { queryOptions } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import isError from "lodash/isError";

import { getToken } from "../../utilities/token.ts";
import { queryKeys } from "./queries.ts";

export const getStats = (userId = "") => {
  return queryOptions({
    queryFn: async () => {
      if (isEmpty(userId)) {
        throw new Error("No user found");
      }

      const url = createUrl("/api/stats", {
        urlBase: globalThis.location.origin,
      });

      if (isError(url)) {
        throw new Error("Failed to create url");
      }

      const data = await fetchJson(
        new Request(url, {
          headers: { Authorization: getToken() },
        }),
        userStatsSchema,
      );

      if (isError(data)) {
        console.log(data);
        throw new Error("Failed to fetch stats");
      }

      return data;
    },
    queryKey: queryKeys.stats(userId),
  });
};
