import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import isError from "lodash/isError";
import isNil from "lodash/isNil.js";

export const getAllBookmarks = async (request: Request, environment: Env) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (isNil(userId)) {
    return createJsonResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  const bookmarks = await attemptAsync(async () => {
    return environment.DB.prepare("select * from bookmarks where userId = ?")
      .bind(userId)
      .all();
  });

  if (isError(bookmarks)) {
    return createJsonResponse(
      { error: "Unable to get bookmarks" },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(bookmarks.results, "OK");
};
