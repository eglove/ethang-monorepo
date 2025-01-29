import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.js";
import { load } from "cheerio";
import isError from "lodash/isError.js";

export const isValidRss = async (urlString: string) => {
  if (!URL.canParse(urlString)) {
    return new Error("Invalid URL");
  }

  const response = await attemptAsync(async () => {
    return fetch(urlString);
  });

  if (isError(response) || !response.ok) {
    return new Error("Could not fetch RSS");
  }

  const data = await attemptAsync(async () => {
    return response.text();
  });

  if (isError(data)) {
    return data;
  }

  const cheerio = load(data);
  return 0 < cheerio("rss").length;
};
