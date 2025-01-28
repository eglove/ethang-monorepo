import { createJsonResponse } from "@ethang/toolbelt/src/fetch/create-json-response.ts";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.js";
import { load } from "cheerio";
import filter from "lodash/filter.js";
import get from "lodash/get.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

export default {
  async fetch(request): Promise<Response> {
    const url = new URL(request.url);

    if ("OPTIONS" === request.method) {
      return createJsonResponse(null, "OK", undefined, request);
    }

    const extractUrl = url.searchParams.get("url");

    if (isNil(extractUrl)) {
      return createJsonResponse(
        { error: "Missing url parameter" },
        "BAD_REQUEST",
        undefined,
        request,
      );
    }

    if ("/" === url.pathname && "GET" === request.method) {
      const response = await attemptAsync(async () => {
        return fetch(extractUrl);
      });

      if (isError(response) || !response.ok) {
        return createJsonResponse(
          { error: "Failed to get data from url" },
          "BAD_REQUEST",
          undefined,
          request,
        );
      }

      const text = await attemptAsync(async () => {
        return response.text();
      });

      if (isError(text)) {
        return createJsonResponse(
          { error: "Failed to get text from page" },
          "BAD_REQUEST",
          undefined,
          request,
        );
      }

      const dom = load(text);
      const allLinks = dom("link[type=application/rss+xml]").get();
      const rssLinks = map(
        filter(allLinks, (link) => {
          return "application/rss+xml" === get(link, ["attribs", "type"]);
        }),
        (element) => {
          return get(element, ["attribs", "href"]);
        },
      );

      return createJsonResponse({ data: rssLinks }, "OK", undefined, request);
    }

    return createJsonResponse(
      { error: "Not Found" },
      "NOT_FOUND",
      undefined,
      request,
    );
  },
} satisfies ExportedHandler<Env>;
