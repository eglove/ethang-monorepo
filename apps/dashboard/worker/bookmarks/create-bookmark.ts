import { createBookmarkSchema } from "@ethang/schemas/src/dashboard/bookmark-schema.ts";
import { v7 } from "uuid";

import { queryOnBody } from "../utilities/query-on-body.ts";

export const createBookmark = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      return environment.DB.prepare(
        "insert into bookmarks (title, url, userId, id) values (?, ?, ?, ?)",
      )
        .bind(body.title, body.url, userId, v7())
        .first();
    },
    request,
    requestSchema: createBookmarkSchema,
  });
};
