import { bookmarkSchema } from "@ethang/schemas/src/dashboard/bookmark.ts";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import isError from "lodash/isError";

export const updateBookmark = async (request: Request, environment: Env) => {
  const body = await parseFetchJson(request, bookmarkSchema);

  if (isError(body)) {
    return createJsonResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  const result = await attemptAsync(async () => {
    return environment.DB.prepare(
      "update bookmarks set title = ?, url = ? where id = ? and userId = ?",
    )
      .bind(body.title, body.url, body.id, body.userId)
      .first();
  });

  if (isError(result)) {
    return createJsonResponse(
      { error: result.message },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(result, "OK");
};
