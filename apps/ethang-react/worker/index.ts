import isError from "lodash/isError.js";
import startsWith from "lodash/startsWith.js";

import { autoAuthenticate } from "./auto-authenticate.ts";

export default {
  async fetch(request, environment) {
    const url = new URL(request.url);

    if (startsWith(url.pathname, "/api/graphql")) {
      const authentication = await autoAuthenticate(request, url, environment);

      if (isError(authentication)) {
        return new Response(authentication.message, { status: 401 });
      }

      return fetch(authentication.destinationUrl.toString(), {
        body: request.body,
        headers: authentication.headers,
        method: request.method
      });
    }

    return new Response(null, { status: 404 });
  }
} satisfies ExportedHandler<Env>;
