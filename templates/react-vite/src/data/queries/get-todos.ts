import { parseFetchJson } from "@ethang/toolbelt/fetch/json";
import { queryOptions } from "@tanstack/react-query";
import isError from "lodash/isError.js";
import { z } from "zod";

import { queryKeys } from "./query-keys.ts";

export const todoSchema = z.object({
  due: z.string(),
  id: z.string(),
  name: z.string(),
});

export const getTodos = () => {
  return queryOptions({
    queryFn: async () => {
      const response = await globalThis.fetch("/api/todos");
      const data = await parseFetchJson(
        response,
        z.object({ data: z.array(todoSchema) }),
      );

      if (isError(data)) {
        throw data;
      }

      return data.data;
    },
    queryKey: queryKeys.getTodos(),
  });
};
