import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import startsWith from "lodash/startsWith";

import { applicationRouter } from "./applications/application-router.ts";
import { bookmarkRouter } from "./bookmarks/bookmark-router.ts";
import { contactRouter } from "./contacts/contact-router.ts";
import { paths } from "./paths.ts";
import { questionAnswerRouter } from "./question-answers/question-answer-router.ts";
import { statsRouter } from "./stats/stats-router.ts";
import { todoRouter } from "./todos/todo-router.ts";
import { getIsAuthenticated } from "./utilities/get-is-authenticated.ts";

export default {
  async fetch(request, environment) {
    const url = new URL(request.url);
    const userId = await getIsAuthenticated(request, environment);
    const tlsVersion = request.cf?.tlsVersion;

    if ("TLSv1.2" !== tlsVersion && "TLSv1.3" !== tlsVersion) {
      return createJsonResponse(
        {
          error: "TLS version 1.2 or higher required.",
        },
        "BAD_REQUEST",
      );
    }

    if (false === userId) {
      return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
    }

    if (startsWith(url.pathname, paths.bookmark)) {
      return bookmarkRouter(request, environment, userId);
    }

    if (startsWith(url.pathname, paths.application)) {
      return applicationRouter(request, environment, userId);
    }

    if (startsWith(url.pathname, paths.questionAnswer)) {
      return questionAnswerRouter(request, environment, userId);
    }

    if (startsWith(url.pathname, paths.contact)) {
      return contactRouter(request, environment, userId);
    }

    if (startsWith(url.pathname, paths.todo)) {
      return todoRouter(request, environment, userId);
    }

    if (startsWith(url.pathname, paths.stats)) {
      return statsRouter(request, environment, userId);
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
