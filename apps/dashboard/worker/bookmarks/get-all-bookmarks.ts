import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import isError from "lodash/isError";

export const getAllBookmarks = async (environment: Env, userId: string) => {
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
