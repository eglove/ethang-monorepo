import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
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
      return createJsonResponse(null, "OK");
    }

    const extractUrl = url.searchParams.get("url");

    if (isNil(extractUrl)) {
      return createJsonResponse(
        { error: "Missing url parameter" },
        "BAD_REQUEST",
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
        );
      }

      const text = await attemptAsync(async () => {
        return response.text();
      });

      if (isError(text)) {
        return createJsonResponse(
          { error: "Failed to get text from page" },
          "BAD_REQUEST",
        );
      }

      const dom = load(text);
      const allLinks = dom("link[type=application/rss+xml]").get();
      const rssLinks = map(
        filter(allLinks, (link) => {
          return "application/rss+xml" === get(link, ["attribs", "type"]);
        }),
        (element) => {
          const hrefText = get(element, ["attribs", "href"]);

          if (URL.canParse(hrefText)) {
            return hrefText;
          }

          return new URL(hrefText, url).href;
        },
      );

      return createJsonResponse({ data: rssLinks }, "OK");
    }

    return createJsonResponse({ error: "Not Found" }, "NOT_FOUND");
  },
} satisfies ExportedHandler<Env>;
