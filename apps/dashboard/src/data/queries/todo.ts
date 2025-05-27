import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import { queryOptions } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";

import { getToken } from "../../utilities/token.ts";
import { queryKeys } from "./queries.ts";

export const getTodos = (userId = "") => {
  return queryOptions({
    enabled: !isNil(userId),
    queryFn: async () => {
      if (isNil(userId)) {
        throw new Error("No userId provided");
      }

      const request = new Request("/api/todo", {
        headers: {
          Authorization: getToken(),
        },
      });
    },
    queryKey: queryKeys.todos(userId),
  });
};
