import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep
} from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { DateTime, Effect } from "effect";
import { XMLParser } from "fast-xml-parser";
import filter from "lodash/filter.js";
import find from "lodash/find.js";
import isArray from "lodash/isArray.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";

import { articlesTable, feedsTable } from "../db/schema.ts";
import { normalizeDate } from "../util/normalize-date.ts";
import { parseFeedMetadata } from "../util/parse-feed-metadata.ts";

const parser = new XMLParser({
  attributeNamePrefix: "@_",
  ignoreAttributes: false
});

const YOUTUBE_SHORTS_REGEX = /https?:\/\/(?:www\.)?youtube\.com\/shorts\//u;

type FeedItem = {
  content?: { "#text"?: string } | string;
  description?: string;
  guid?: { "#text"?: string } | string;
  id?: string;
  link?:
    { "@_href"?: string; "@_rel"?: string }[] | { "@_href"?: string } | string;
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

export const normalizeLink = (item: FeedItem) => {
  if (isString(item.link)) {
    return item.link;
  }

  if (isObject(item.link) && !isNil(item.link)) {
    if (isArray(item.link)) {
      const alternate =
        find(item.link, (l) => {
          return "alternate" === l["@_rel"];
        }) ?? item.link[0];

      if (isNil(alternate)) {
        return "";
      }

      const href = alternate["@_href"];
      const fallback = isString(alternate) ? alternate : "";
      return href ?? fallback;
    }

    return (
      (item.link as Record<string, string>)["@_href"] ??
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      (item.link as unknown as string)
    );
  }

  return "";
};

export const normalizeGuid = (item: FeedItem, link: string) => {
  if (isString(item.guid)) {
    return item.guid;
  }

  if (isObject(item.guid) && !isNil(item.guid)) {
    return (item.guid as Record<string, string>)["#text"] ?? link;
  }

  return item.id ?? link;
};

export const normalizeContent = (item: FeedItem) => {
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

export const normalizeTitle = (item: FeedItem) => {
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
  ) {
    const database = drizzle(this.env.ethang_rss);

    const feeds = await step.do("get-feeds", async () => {
      return database.select().from(feedsTable);
    });

    for (const feed of feeds) {
      // eslint-disable-next-line no-await-in-loop
      await step.do(`fetch-feed-${feed.id}`, async () => {
        const fetchError: Error | null = await Effect.runPromise(
          Effect.tryPromise({
            catch: (error: unknown) => {
              return Error.isError(error) ? error : new Error(String(error));
            },
            try: async () => {
              const response = await fetch(feed.xmlAddress);
              const xml = await response.text();
              const parsedMeta = parseFeedMetadata(xml);
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion,@ethang/validate-unknown -- `parser.parse` returns `any` from `fast-xml-parser`; the downstream shape is already declared via the `FeedResult` type alias and consumed through manual narrowing in the normalizer helpers
              const parseResult = parser.parse(xml) as unknown as FeedResult;

              const rawItems =
                parseResult.rss?.channel?.item ?? parseResult.feed?.entry ?? [];
              const items = isArray(rawItems) ? rawItems : [rawItems];

              const normalizedItems = map(items, (item) => {
                const link = normalizeLink(item);
                const guid = normalizeGuid(item, link);
                const content = normalizeContent(item);
                const title = normalizeTitle(item);

                const publishedAt = normalizeDate(
                  item.pubDate ?? item.published ?? item.updated
                );

                return {
                  content,
                  feedId: feed.id,
                  guid,
                  link,
                  publishedAt,
                  title
                };
              });

              const filteredItems = filter(normalizedItems, (item) => {
                return !YOUTUBE_SHORTS_REGEX.test(item.link);
              });

              const itemsToInsert = filter(filteredItems, (item) => {
                return !isNil(item.guid) && "" !== item.guid;
              });

              const insertPromises = map(itemsToInsert, async (item) => {
                return database
                  .insert(articlesTable)
                  .values(item)
                  .onConflictDoNothing();
              });

              await Promise.all(insertPromises);

              const updateFields: Partial<typeof feedsTable.$inferInsert> = {
                lastFetchedAt: DateTime.formatIso(DateTime.unsafeNow())
              };

              if ("" !== parsedMeta.title) {
                updateFields.title = parsedMeta.title;
              }

              if ("" !== parsedMeta.website) {
                updateFields.website = parsedMeta.website;
              }

              await database
                .update(feedsTable)
                .set(updateFields)
                .where(eq(feedsTable.id, feed.id));
            }
          }).pipe(
            Effect.matchEffect({
              onFailure: (error: Error) => {
                return Effect.succeed(error);
              },
              onSuccess: () => {
                return Effect.succeed(null as Error | null);
              }
            })
          )
        );

        if (!isNil(fetchError)) {
          Effect.runSync(
            Effect.logError(`Failed to fetch feed ${feed.xmlAddress}`, {
              error: fetchError.message,
              feedId: feed.id,
              feedUrl: feed.xmlAddress,
              stack: fetchError.stack
            })
          );
          Effect.runSync(Effect.die(fetchError));
        }
      });
    }
  }
}
