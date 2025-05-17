import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";

import { createBookmark } from "./create-bookmark.ts";
import { deleteBookmark } from "./delete-bookmark.ts";
import { getAllBookmarks } from "./get-all-bookmarks.ts";
import { updateBookmark } from "./update-bookmark.ts";

export const bookmarkRouter = async (request: Request, environment: Env) => {
  switch (request.method) {
    case "DELETE": {
      return deleteBookmark(request, environment);
    }

    case "GET": {
      return getAllBookmarks(request, environment);
    }

    case "POST": {
      return createBookmark(request, environment);
    }

    case "PUT": {
      return updateBookmark(request, environment);
    }

    default: {
      return createJsonResponse(
        { error: "Method not allowed" },
        "METHOD_NOT_ALLOWED",
      );
    }
  }
};
