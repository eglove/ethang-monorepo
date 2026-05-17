import type DataLoader from "dataloader";

import { and, desc, eq, lt } from "drizzle-orm";
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
    parameters: { after?: string; first?: number },
    context: ServerContext
  ) => {
    const { after, first = 20 } = parameters;
    const limit = first + 1;

    const subscriptions = await database
      .select({
        feedId: databaseSchema.subscriptionsTable.feedId,
        id: databaseSchema.subscriptionsTable.id
      })
      .from(databaseSchema.subscriptionsTable)
      .where(
        and(
          eq(databaseSchema.subscriptionsTable.userId, context.user.sub),
          isNil(after)
            ? undefined
            : lt(databaseSchema.subscriptionsTable.id, after)
        )
      )
      .orderBy(desc(databaseSchema.subscriptionsTable.id))
      .limit(limit);

    const hasNextPage = subscriptions.length > first;
    const items = subscriptions.slice(0, first);

    const feeds = await feedLoader.loadMany(
      map(items, (result) => {
        return result.feedId;
      })
    );

    const edges = map(feeds, (feed, index) => {
      if (isError(feed) || isNil(feed)) {
        throw new Error("Unexpected error occurred.");
      }

      return {
        cursor: items[index]?.id ?? "",
        node: {
          __typename: "Feed" as const,
          id: feed.id,
          lastFetchedAt: feed.lastFetchedAt,
          title: feed.title,
          website: feed.website,
          xmlAddress: feed.xmlAddress
        }
      };
    });

    return {
      edges,
      pageInfo: {
        endCursor: edges.at(-1)?.cursor ?? null,
        hasNextPage,
        hasPreviousPage: false,
        startCursor: edges.at(0)?.cursor ?? null
      }
    };
  };
};
