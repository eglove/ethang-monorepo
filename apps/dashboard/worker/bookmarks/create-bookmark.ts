import { createBookmarkSchema } from "@ethang/schemas/src/dashboard/bookmark-schema.ts";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import isError from "lodash/isError";
import { v7 } from "uuid";

export const createBookmark = async (request: Request, environment: Env) => {
  const body = await parseFetchJson(request, createBookmarkSchema);

  if (isError(body)) {
    return createJsonResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  const bookmark = await attemptAsync(async () => {
    return environment.DB.prepare(
      "insert into bookmarks (title, url, userId, id) values (?, ?, ?, ?)",
    )
      .bind(body.title, body.url, body.userId, v7())
      .first();
  });

  if (isError(bookmark)) {
    return createJsonResponse(
      { error: bookmark.message },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(bookmark, "OK");
};
