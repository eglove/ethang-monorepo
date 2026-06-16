/* eslint-disable @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/prefer-destructuring,@typescript-eslint/no-unsafe-assignment,sonar/cognitive-complexity,sonar/cyclomatic-complexity */
import { XMLParser } from "fast-xml-parser";
import find from "lodash/find.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import isString from "lodash/isString.js";
import trim from "lodash/trim.js";

export const parseFeedMetadata = (xmlText: string) => {
  const parser = new XMLParser({
    attributeNamePrefix: "@_",
    ignoreAttributes: false
  });

  const parsed = parser.parse(xmlText) as Record<string, unknown>;

  let title = "";
  let website = "";

  if (isObject(parsed["rss"])) {
    const rss = parsed["rss"] as Record<string, unknown>;
    if (isObject(rss["channel"])) {
      const channel = rss["channel"] as Record<string, unknown>;

      if (isString(channel["title"])) {
        title = channel["title"];
      }

      if (isObject(channel["title"])) {
        title = (channel["title"] as Record<string, string>)["#text"] ?? "";
      }

      if (isString(channel["link"])) {
        website = channel["link"];
      }

      if (isObject(channel["link"])) {
        website = (channel["link"] as Record<string, string>)["#text"] ?? "";
      }
    }
  } else if (isObject(parsed["feed"])) {
    const feed = parsed["feed"] as Record<string, unknown>;

    if (isString(feed["title"])) {
      title = feed["title"];
    }

    if (isObject(feed["title"])) {
      title = (feed["title"] as Record<string, string>)["#text"] ?? "";
    }

    const links = feed["link"];
    if (isString(links)) {
      website = links;
    }

    if (isArray(links)) {
      const alternate =
        find(links, (l) => {
          return (
            isObject(l) &&
            "alternate" === (l as Record<string, string>)["@_rel"]
          );
        }) ??
        find(links, (l) => {
          return (
            isObject(l) &&
            (isNil((l as Record<string, string>)["@_rel"]) ||
              "self" !== (l as Record<string, string>)["@_rel"])
          );
        }) ??
        links[0];

      if (isString(alternate)) {
        website = alternate;
      }

      if (isObject(alternate)) {
        website = (alternate as Record<string, string>)["@_href"] ?? "";
      }
    } else if (isObject(links)) {
      website =
        (links as Record<string, string>)["@_href"] ??
        (links as Record<string, string>)["#text"] ??
        "";
    } else {
      // do nothing
    }
  } else {
    // do nothing
  }

  return {
    title: trim(title),
    website: trim(website)
  };
};
