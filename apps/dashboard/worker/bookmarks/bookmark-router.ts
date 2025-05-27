import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";

import { createBookmark } from "./create-bookmark.ts";
import { deleteBookmark } from "./delete-bookmark.ts";
import { getAllBookmarks } from "./get-all-bookmarks.ts";
import { updateBookmark } from "./update-bookmark.ts";

export const bookmarkRouter = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  switch (request.method) {
    case "DELETE": {
      return deleteBookmark(request, environment, userId);
    }

    case "GET": {
      return getAllBookmarks(environment, userId);
    }

    case "POST": {
      return createBookmark(request, environment, userId);
    }

    case "PUT": {
      return updateBookmark(request, environment, userId);
    }

    default: {
      return createJsonResponse(
        { error: "Method not allowed" },
        "METHOD_NOT_ALLOWED",
      );
    }
  }
};
