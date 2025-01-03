import { deleteUser } from "./delete-user";
import { editUser } from "./edit-user";
import { getUser } from "./get-user";
import { signIn } from "./sign-in.ts";
import { signUp } from "./sign-up";

export default {

  async fetch(
    request, environment,
  ): Promise<Response> {
    const url = new URL(request.url);

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

    if ("/login" === url.pathname) {
      return new Response("yo");
    }

    return new Response("Not Found", {
      status: 404,
    });
  },
} satisfies ExportedHandler<Env>;
