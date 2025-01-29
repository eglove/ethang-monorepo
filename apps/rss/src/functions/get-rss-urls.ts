import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.ts";
import { load } from "cheerio";
import filter from "lodash/filter.js";
import get from "lodash/get.js";
import isError from "lodash/isError.js";
import map from "lodash/map.js";

export const getRssUrls = async (urLString: string) => {
  if (!URL.canParse(urLString)) {
    return new Error("Invalid URL");
  }

  const response = await attemptAsync(async () => {
    return fetch(urLString);
  });

  if (isError(response)) {
    return response;
  }

  if (!response.ok) {
    return new Error("Could not fetch RSS");
  }

  const text = await attemptAsync(async () => {
    return response.text();
  });

  if (isError(text)) {
    return text;
  }

  const dom = load(text);
  const allLinks = dom("link[type=application/rss+xml]").get();

  const rssLinks = filter(allLinks, (link) => {
    return "application/rss+xml" === get(link, ["attribs", "type"]);
  });

  return map(rssLinks, (element) => {
    const hrefText = get(element, ["attribs", "href"]);

    if (URL.canParse(hrefText)) {
      return hrefText;
    }

    return new URL(hrefText, urLString).href;
  });
};
