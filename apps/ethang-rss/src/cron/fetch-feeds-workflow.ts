import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep
} from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { DateTime, Duration, Effect, Option, Schema } from "effect";
import { XMLParser } from "fast-xml-parser";
import filter from "lodash/filter.js";
import find from "lodash/find.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";

import { cleanupOldArticles } from "../data/mutations/cleanup-old-articles.ts";
import { articlesTable, feedsTable } from "../db/schema.ts";
import { normalizeDate } from "../util/normalize-date.ts";
import { parseFeedMetadata } from "../util/parse-feed-metadata.ts";

const ARTICLE_RETENTION_DAYS = 90;

const getArticleCutoffIso = () => {
  return DateTime.formatIso(
    DateTime.subtractDuration(
      DateTime.unsafeNow(),
      Duration.days(ARTICLE_RETENTION_DAYS)
    )
  );
};

const isArticleWithinRetention = (publishedAt: string) => {
  const cutoff = getArticleCutoffIso();

  const cutoffDt = Option.getOrElse(DateTime.make(cutoff), () => {
    return DateTime.unsafeMake(0);
  });
  const publishedDt = Option.getOrElse(DateTime.make(publishedAt), () => {
    return DateTime.unsafeMake(0);
  });

  return (
    DateTime.toEpochMillis(publishedDt) >= DateTime.toEpochMillis(cutoffDt)
  );
};

export const fetchSingleFeed = async (
  database: Pick<
    ReturnType<typeof drizzle>,
    "delete" | "insert" | "select" | "update"
  >,
  feed: { id: string; xmlAddress: string }
) => {
  const response = await fetch(feed.xmlAddress);
  const xml = await response.text();
  const parsedMeta = parseFeedMetadata(xml);
  const parseResult = parseFeedItems(xml);

  const items =
    parseResult?.rss?.channel?.item ?? parseResult?.feed?.entry ?? [];

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
    return (
      !isNil(item.guid) &&
      "" !== item.guid &&
      isArticleWithinRetention(item.publishedAt)
    );
  });

  const insertPromises = map(itemsToInsert, async (item) => {
    return database.insert(articlesTable).values(item).onConflictDoNothing();
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
};

const parser = new XMLParser({
  attributeNamePrefix: "@_",
  ignoreAttributes: false
});

const YOUTUBE_SHORTS_REGEX = /https?:\/\/(?:www\.)?youtube\.com\/shorts\//u;

const TextObjectSchema = Schema.Struct({
  "#text": Schema.optional(Schema.String)
});
const TextValueSchema = Schema.Union(Schema.String, TextObjectSchema);
const LinkObjectSchema = Schema.Struct({
  "@_href": Schema.optional(Schema.String),
  "@_rel": Schema.optional(Schema.String)
});
const LinkEntrySchema = Schema.Union(Schema.String, LinkObjectSchema);
const LinkEntriesSchema = Schema.Array(LinkEntrySchema);
const LinkValueSchema = Schema.Union(
  Schema.String,
  LinkObjectSchema,
  LinkEntriesSchema
);
const FeedItemSchema = Schema.Struct({
  content: Schema.optional(TextValueSchema),
  description: Schema.optional(Schema.String),
  guid: Schema.optional(TextValueSchema),
  id: Schema.optional(Schema.String),
  link: Schema.optional(LinkValueSchema),
  pubDate: Schema.optional(Schema.String),
  published: Schema.optional(Schema.String),
  summary: Schema.optional(Schema.String),
  title: Schema.optional(TextValueSchema),
  updated: Schema.optional(Schema.String)
});
const FeedItemArraySchema = Schema.Array(FeedItemSchema);
const FeedItemsSchema = Schema.Union(FeedItemSchema, FeedItemArraySchema).pipe(
  Schema.transform(Schema.Array(FeedItemSchema), {
    decode: (items) => {
      return Schema.is(FeedItemArraySchema)(items) ? items : [items];
    },

    encode: (items) => {
      return items;
    },
    strict: true
  })
);
const OptionalFeedItemsSchema = Schema.optional(FeedItemsSchema);
const FeedSchema = Schema.Struct({ entry: OptionalFeedItemsSchema });
const ChannelSchema = Schema.Struct({ item: OptionalFeedItemsSchema });
const OptionalChannelSchema = Schema.optional(ChannelSchema);
const RssSchema = Schema.Struct({ channel: OptionalChannelSchema });
const FeedResultSchema = Schema.Struct({
  feed: Schema.optional(FeedSchema),
  rss: Schema.optional(RssSchema)
});

type FeedItem = Schema.Schema.Type<typeof FeedItemSchema>;

const isLinkEntryArray = Schema.is(LinkEntriesSchema);
const isLinkObject = Schema.is(LinkObjectSchema);
const isTextObject = Schema.is(TextObjectSchema);

const linkFromEntries = (
  entries: Schema.Schema.Type<typeof LinkEntriesSchema>
) => {
  const alternate =
    find(entries, (entry) => {
      return isLinkObject(entry) && "alternate" === entry["@_rel"];
    }) ?? entries[0];

  if (isNil(alternate)) {
    return "";
  }

  if (isString(alternate)) {
    return alternate;
  }

  return alternate["@_href"] ?? "";
};

const parseFeedItems = (xml: string) => {
  return Effect.runSync(
    Effect.try({
      catch: (error: unknown) => {

        return Error.isError(error) ? error : new Error(String(error));
      },
      try: () => {
        return Schema.decodeUnknownSync(FeedResultSchema)(parser.parse(xml));
      }
    }).pipe(
      Effect.catchAll(() => {
        return Effect.succeed(null);
      })
    )
  );
};

export const normalizeLink = (item: FeedItem) => {
  if (isString(item.link)) {
    return item.link;
  }

  if (isLinkEntryArray(item.link)) {
    return linkFromEntries(item.link);
  }

  return isLinkObject(item.link) ? (item.link["@_href"] ?? "") : "";
};

export const normalizeGuid = (item: FeedItem, link: string) => {
  if (isString(item.guid)) {
    return item.guid;
  }

  if (isTextObject(item.guid)) {
    return item.guid["#text"] ?? link;
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

  if (isTextObject(item.content)) {
    return item.content["#text"] ?? "";
  }

  return item.summary ?? "";
};

export const normalizeTitle = (item: FeedItem) => {
  if (isString(item.title)) {
    return item.title;
  }

  if (isTextObject(item.title)) {
    return item.title["#text"] ?? "No Title";
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
              return database.transaction(async (tx) => {
                return fetchSingleFeed(tx, feed);
              });
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

        return null;
      });
    }

    await step.do("cleanup-old-articles", async () => {
      await database.transaction(async (tx) => {
        return cleanupOldArticles(tx);
      });
      return null;
    });
  }
}
