import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.ts";

import { deleteUser } from "./delete-user.ts";
import { editUser } from "./edit-user.ts";
import { getUser } from "./get-user.ts";
import { signIn } from "./sign-in.ts";
import { signUp } from "./sign-up.ts";
import { verifyToken } from "./verify-token.js";

export default {
  async fetch(request, environment): Promise<Response> {
    const url = new URL(request.url);

    if ("OPTIONS" === request.method) {
      return createJsonResponse(null, "OK");
    }

    if ("/user" === url.pathname && "GET" === request.method) {
      return getUser(request, environment);
    }

    if ("/user" === url.pathname && "POST" === request.method) {
      return signUp(request, environment);
    }

    if ("/user" === url.pathname && "PUT" === request.method) {
      return editUser(request, environment);
    }

    if ("/user" === url.pathname && "DELETE" === request.method) {
      return deleteUser(request, environment);
    }

    if ("/sign-in" === url.pathname && "POST" === request.method) {
      return signIn(request, environment);
    }

    if ("/verify" === url.pathname && "GET" === request.method) {
      return verifyToken(request, environment);
    }

    return createJsonResponse({ error: "Not Found" }, "NOT_FOUND");
  },
} satisfies ExportedHandler<Env>;
