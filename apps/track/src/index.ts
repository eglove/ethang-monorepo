import {
  createJsonResponse,
} from "@ethang/toolbelt/src/fetch/create-json-response.ts";

import { fromDataParameter } from "./from-data-parameter.js";

export default {
  async fetch(
    request,
    environment,
  ) {
    const url = new globalThis.URL(request.url);

    if ("/track" === url.pathname && "GET" === request.method) {
      return fromDataParameter(request, environment);
    }

    return createJsonResponse(
      { error: "Not Found" },
      "NOT_FOUND",
      undefined,
      request,
    );
  },
} satisfies ExportedHandler<Env>;
