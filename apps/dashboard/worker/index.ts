import { createClerkClient } from "@clerk/backend";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import { jwtDecode } from "jwt-decode";
import isError from "lodash/isError";
import isNil from "lodash/isNil.js";
import startsWith from "lodash/startsWith";

import { applicationRouter } from "./applications/application-router.ts";
import { bookmarkRouter } from "./bookmarks/bookmark-router.ts";
import { contactRouter } from "./contacts/contact-router.ts";
import { paths } from "./paths.ts";
import { questionAnswerRouter } from "./question-answers/question-answer-router.ts";

export default {
  async fetch(request, environment) {
    const url = new URL(request.url);
    const authHeader = request.headers.get("Authorization");

    if (isNil(authHeader)) {
      return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
    }

    const isDevelopment = "development" === import.meta.env.MODE;
    const keys = isDevelopment
      ? ([environment.CLERK_PUBLIC_KEY, environment.CLERK_SECRET_KEY] as [
          string,
          string,
        ])
      : await attemptAsync(async () => {
          return Promise.all([
            environment.clerkPublishableKey.get(),
            environment.clerkSecretKey.get(),
          ]);
        });

    if (isError(keys)) {
      return createJsonResponse({ error: keys.message }, "UNAUTHORIZED");
    }

    const [pk, sk] = keys;

    const clerkClient = createClerkClient({
      publishableKey: pk,
      secretKey: sk,
    });

    const { isSignedIn, token } =
      await clerkClient.authenticateRequest(request);

    if (!isSignedIn || isNil(token)) {
      return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
    }

    const decoded = jwtDecode(token);
    const userId = decoded.sub;

    if (isNil(userId)) {
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

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
