import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep
} from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { XMLParser } from "fast-xml-parser";
import find from "lodash/find.js";
import isArray from "lodash/isArray.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";

import { articlesTable, feedsTable } from "../db/schema.ts";

const parser = new XMLParser({
  attributeNamePrefix: "@_",
  ignoreAttributes: false
});

type FeedItem = {
  content?: { "#text"?: string } | string;
  description?: string;
  guid?: { "#text"?: string } | string;
  id?: string;
  link?:
    | { "@_href"?: string; "@_rel"?: string }[]
    | { "@_href"?: string }
    | string;
  pubDate?: string;
  published?: string;
  summary?: string;
  title?: { "#text"?: string } | string;
  updated?: string;
};

type FeedResult = {
  feed?: {
    entry?: FeedItem | FeedItem[];
  };
  rss?: {
    channel?: {
      item?: FeedItem | FeedItem[];
    };
  };
};

const normalizeLink = (item: FeedItem): string => {
  if (isString(item.link)) {
    return item.link;
  }

  if (isObject(item.link) && !isNil(item.link)) {
    if (isArray(item.link)) {
      const alternate =
        find(item.link, (l) => {
          return "alternate" === l["@_rel"];
        }) ?? item.link[0];

      return (
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        (alternate as Record<string, string> | undefined)?.["@_href"] ??
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        (alternate as unknown as string) ??
        ""
      );
    }

    return (
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      (item.link as Record<string, string>)["@_href"] ??
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      (item.link as unknown as string) ??
      ""
    );
  }

  return "";
};

const normalizeGuid = (item: FeedItem, link: string): string => {
  if (isString(item.guid)) {
    return item.guid;
  }

  if (isObject(item.guid) && !isNil(item.guid)) {
    return (item.guid as Record<string, string>)["#text"] ?? link;
  }

  return item.id ?? link;
};

const normalizeContent = (item: FeedItem): string => {
  if (isString(item.description)) {
    return item.description;
  }

  if (isString(item.content)) {
    return item.content;
  }

  if (isObject(item.content) && !isNil(item.content)) {
    return (item.content as Record<string, string>)["#text"] ?? "";
  }

  return item.summary ?? "";
};

const normalizeTitle = (item: FeedItem): string => {
  if (isString(item.title)) {
    return item.title;
  }

  if (isObject(item.title) && !isNil(item.title)) {
    return (item.title as Record<string, string>)["#text"] ?? "No Title";
  }

  return "No Title";
};

export class FetchFeedsWorkflow extends WorkflowEntrypoint<Env> {
  public override async run(
    _event: WorkflowEvent<unknown>,
    step: WorkflowStep
  ): Promise<void> {
    const database = drizzle(this.env.ethang_rss);

    const feeds = await step.do("get-feeds", async () => {
      return database.select().from(feedsTable);
    });

    for (const feed of feeds) {
      // eslint-disable-next-line no-await-in-loop
      await step.do(`fetch-feed-${feed.id}`, async () => {
        const error = await attemptAsync(async () => {
          const response = await fetch(feed.xmlAddress);
          const xml = await response.text();
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          const result = parser.parse(xml) as unknown as FeedResult;

          const rawItems =
            result.rss?.channel?.item ?? result.feed?.entry ?? [];
          const items = isArray(rawItems) ? rawItems : [rawItems];

          const normalizedItems = map(items, (item) => {
            const link = normalizeLink(item);
            const guid = normalizeGuid(item, link);
            const content = normalizeContent(item);
            const title = normalizeTitle(item);

            const publishedAt =
              item.pubDate ??
              item.published ??
              item.updated ??
              new Date().toISOString();

            return {
              content,
              feedId: feed.id,
              guid,
              link,
              publishedAt,
              title
            };
          });

          const insertPromises = map(normalizedItems, async (item) => {
            if (isNil(item.guid) || "" === item.guid) {
              return;
            }

            return database
              .insert(articlesTable)
              .values(item)
              .onConflictDoNothing();
          });

          await Promise.all(insertPromises);

          await database
            .update(feedsTable)
            .set({ lastFetchedAt: new Date().toISOString() })
            .where(eq(feedsTable.id, feed.id));
        });

        if (isError(error)) {
          // eslint-disable-next-line no-console
          console.error(`Failed to fetch feed ${feed.xmlAddress}:`, error);
          throw error; // Rethrow so Workflow can retry if configured
        }
      });
    }
  }
}
