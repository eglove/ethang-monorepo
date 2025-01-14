import isNil from "lodash/isNil";

import { deleteUser } from "./delete-user";
import { editUser } from "./edit-user";
import { getUser } from "./get-user";
import { signIn } from "./sign-in.ts";
import { signUp } from "./sign-up";

class Store {
  public corsHeaders = {
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE",
    "Access-Control-Allow-Origin": "",
  };

  public setOrigin(origin: string) {
    this.corsHeaders["Access-Control-Allow-Origin"] = origin;
  }
}
export const store = new Store();

export default {

  async fetch(
    request, environment,
  ): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (!isNil(origin) && (/\.ethang.dev%/u).test(new URL(origin).hostname)) {
      store.setOrigin(origin);
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

    return new Response("Not Found", {
      status: 404,
    });
  },
} satisfies ExportedHandler<Env>;
