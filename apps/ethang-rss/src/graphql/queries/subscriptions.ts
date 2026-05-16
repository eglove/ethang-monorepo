import type DataLoader from "dataloader";

import { eq } from "drizzle-orm";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import type { ServerContext } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";

type Feed = typeof databaseSchema.feedsTable.$inferSelect;

export const subscriptionsQuery = (
  database: Database,
  feedLoader: DataLoader<string, Feed | null>
) => {
  return async (
    _parent: unknown,
    _arguments: unknown,
    context: ServerContext
  ) => {
    const subscriptions = await database
      .select({
        feedId: databaseSchema.subscriptionsTable.feedId
      })
      .from(databaseSchema.subscriptionsTable)
      .where(eq(databaseSchema.subscriptionsTable.userId, context.user.sub));

    const feeds = await feedLoader.loadMany(
      map(subscriptions, (result) => {
        return result.feedId;
      })
    );

    return map(feeds, (feed) => {
      if (isError(feed) || isNil(feed)) {
        throw new Error("Unexpected error occurred.");
      }

      return {
        __typename: "Feed",
        id: feed.id,
        lastFetchedAt: feed.lastFetchedAt,
        title: feed.title,
        website: feed.website,
        xmlAddress: feed.xmlAddress
      };
    });
  };
};
