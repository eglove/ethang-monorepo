import { todosSchema } from "@ethang/schemas/src/dashboard/todo-schema.ts";
import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import { queryOptions } from "@tanstack/react-query";
import isError from "lodash/isError";
import isNil from "lodash/isNil.js";

import { queryKeys } from "./queries.ts";

export const getTodos = (userId = "") => {
  return queryOptions({
    enabled: !isNil(userId),
    queryFn: async () => {
      if (isNil(userId)) {
        throw new Error("No userId provided");
      }

      const data = await fetchJson("/api/todo", todosSchema);

      if (isError(data)) {
        throw new Error("Failed to fetch todos");
      }

      return data;
    },
    queryKey: queryKeys.todos(userId),
  });
};
