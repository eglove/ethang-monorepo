import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import { eq } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";
import attempt from "lodash/attempt.js";
import find from "lodash/find.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import isString from "lodash/isString.js";
import trim from "lodash/trim.js";

import type { ServerContext } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";

const parseFeedMetadata = (
  xmlText: string
  // eslint-disable-next-line sonar/cognitive-complexity,sonar/cyclomatic-complexity
): { title: string; website: string } => {
  const parser = new XMLParser({
    attributeNamePrefix: "@_",
    ignoreAttributes: false
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const parsed = parser.parse(xmlText) as Record<string, unknown>;

  let title = "";
  let website = "";

  if (isObject(parsed["rss"])) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const rss = parsed["rss"] as Record<string, unknown>;
    if (isObject(rss["channel"])) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const channel = rss["channel"] as { link: string; title: string };

      if (isString(channel.title)) {
        // eslint-disable-next-line @typescript-eslint/prefer-destructuring
        title = channel.title;
      }

      if (isObject(channel.title)) {
        title = (channel.title as Record<string, string>)["#text"] ?? "";
      }

      if (isString(channel.link)) {
        website = channel.link;
      }

      if (isObject(channel.link)) {
        website = (channel.link as Record<string, string>)["#text"] ?? "";
      }
    }
    // eslint-disable-next-line sonar/elseif-without-else
  } else if (isObject(parsed["feed"])) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const feed = parsed["feed"] as Record<string, unknown>;

    if (isString(feed["title"])) {
      // eslint-disable-next-line @typescript-eslint/prefer-destructuring
      title = feed["title"];
    }

    if (isObject(feed["title"])) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      title = (feed["title"] as Record<string, string>)["#text"] ?? "";
    }

    const links = feed["link"];
    if (isString(links)) {
      website = links;
    }

    if (isArray(links)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const alternate =
        find(links, (l) => {
          return (
            isObject(l) &&
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            "alternate" === (l as Record<string, string>)["@_rel"]
          );
        }) ??
        find(links, (l) => {
          return (
            isObject(l) &&
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            (isNil((l as Record<string, string>)["@_rel"]) ||
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
              "self" !== (l as Record<string, string>)["@_rel"])
          );
        }) ??
        links[0];

      if (isString(alternate)) {
        website = alternate;
      }

      if (isObject(alternate)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        website = (alternate as Record<string, string>)["@_href"] ?? "";
      }
      // eslint-disable-next-line sonar/elseif-without-else
    } else if (isObject(links)) {
      website =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        (links as Record<string, string>)["@_href"] ??
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        (links as Record<string, string>)["#text"] ??
        "";
    }
  }

  return {
    title: trim(title),
    website: trim(website)
  };
};

export const addSubscriptionMutation = (database: Database) => {
  return async (
    _parent: unknown,
    parameters: { title?: string; website?: string; xmlAddress: string },
    context: unknown
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const serverContext = context as ServerContext;
    let [feed] = await database
      .select()
      .from(databaseSchema.feedsTable)
      .where(eq(databaseSchema.feedsTable.xmlAddress, parameters.xmlAddress));

    if (isNil(feed)) {
      let derivedTitle = parameters.title ?? "";
      let derivedWebsite = parameters.website ?? "";

      const needsMetadata =
        "" === trim(derivedTitle) || "" === trim(derivedWebsite);

      if (needsMetadata) {
        await attemptAsync(async () => {
          const response = await globalThis.fetch(parameters.xmlAddress);

          if (response.ok) {
            const xmlText = await response.text();
            const parsedMeta = parseFeedMetadata(xmlText);

            // eslint-disable-next-line sonar/nested-control-flow
            if ("" === trim(derivedTitle) && parsedMeta.title) {
              derivedTitle = parsedMeta.title;
            }

            // eslint-disable-next-line sonar/nested-control-flow
            if ("" === trim(derivedWebsite) && parsedMeta.website) {
              derivedWebsite = parsedMeta.website;
            }
          }
        });

        if ("" === trim(derivedTitle) || "" === trim(derivedWebsite)) {
          attempt(() => {
            const url = new URL(parameters.xmlAddress);

            // eslint-disable-next-line sonar/nested-control-flow
            if ("" === trim(derivedTitle)) {
              derivedTitle = url.hostname;
            }

            // eslint-disable-next-line sonar/nested-control-flow
            if ("" === trim(derivedWebsite)) {
              derivedWebsite = url.origin;
            }
          });
        }
      }

      [feed] = await database
        .insert(databaseSchema.feedsTable)
        .values({
          title: trim(derivedTitle),
          website: trim(derivedWebsite),
          xmlAddress: parameters.xmlAddress
        })
        .returning();
    }

    if (isNil(feed)) {
      throw new Error("Unable to insert feed");
    }

    await database
      .insert(databaseSchema.subscriptionsTable)
      .values({
        feedId: feed.id,
        userId: serverContext.user.sub
      })
      .onConflictDoNothing();

    return feed;
  };
};
