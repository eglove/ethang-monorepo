import { deleteBookmarkSchema } from "@ethang/schemas/src/dashboard/bookmark-schema.ts";

import { queryOnBody } from "../utilities/query-on-body.ts";

export const deleteBookmark = async (request: Request, environment: Env) => {
  return queryOnBody({
    dbFunction: async (body) => {
      return environment.DB.prepare(
        "delete from bookmarks where id = ? and userId = ?",
      )
        .bind(body.id, body.userId)
        .first();
    },
    request,
    requestSchema: deleteBookmarkSchema,
  });
};
