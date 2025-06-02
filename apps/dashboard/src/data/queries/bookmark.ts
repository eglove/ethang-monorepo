import { bookmarksSchema } from "@ethang/schemas/src/dashboard/bookmark-schema.ts";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json";
import { queryOptions } from "@tanstack/react-query";
import isError from "lodash/isError";
import isNil from "lodash/isNil.js";

import { queryKeys } from "./queries.ts";

export const getBookmarks = (userId = "") => {
  return queryOptions({
    enabled: !isNil(userId),
    queryFn: async () => {
      if (isNil(userId)) {
        return null;
      }

      const response = await globalThis.fetch(`/api/bookmark`);
      const data = await parseFetchJson(response, bookmarksSchema);

      if (isError(data)) {
        throw data;
      }

      return data;
    },
    queryKey: queryKeys.bookmarks(userId),
  });
};
