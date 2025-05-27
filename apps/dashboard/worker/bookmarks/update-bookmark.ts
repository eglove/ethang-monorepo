import { bookmarkSchema } from "@ethang/schemas/src/dashboard/bookmark-schema.ts";

import { queryOnBody } from "../utilities/query-on-body.ts";

export const updateBookmark = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      return environment.DB.prepare(
        "update bookmarks set title = ?, url = ? where id = ? and userId = ?",
      )
        .bind(body.title, body.url, body.id, userId)
        .first();
    },
    request,
    requestSchema: bookmarkSchema,
  });
};
