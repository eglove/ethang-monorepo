import { and, desc, eq, lt } from "drizzle-orm";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import type { User } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";
import { createConnection } from "../util/pagination.ts";
import { getReadStateFilter } from "../util/read-filter.ts";

export const feedArticlesQuery = async (
  database: Database,
  parameters: {
    after?: string;
    feedId: string;
    first?: number;
    isRead?: boolean;
  },
  user: User
) => {
  const { after, feedId, first = 20, isRead } = parameters;
  const limit = first + 1;

  const readStateFilter = getReadStateFilter(database, user.sub, {
    isRead
  });

  const articles = await database
    .select({
      content: databaseSchema.articlesTable.content,
      feedId: databaseSchema.articlesTable.feedId,
      feedTitle: databaseSchema.feedsTable.title,
      guid: databaseSchema.articlesTable.guid,
      id: databaseSchema.articlesTable.id,
      isRead: databaseSchema.userItemStatesTable.isRead,
      link: databaseSchema.articlesTable.link,
      publishedAt: databaseSchema.articlesTable.publishedAt,
      title: databaseSchema.articlesTable.title
    })
    .from(databaseSchema.articlesTable)
    .leftJoin(
      databaseSchema.feedsTable,
      eq(databaseSchema.articlesTable.feedId, databaseSchema.feedsTable.id)
    )
    .leftJoin(
      databaseSchema.userItemStatesTable,
      and(
        eq(
          databaseSchema.articlesTable.id,
          databaseSchema.userItemStatesTable.articleId
        ),
        eq(databaseSchema.userItemStatesTable.userId, user.sub)
      )
    )
    .where(
      and(
        eq(databaseSchema.articlesTable.feedId, feedId),
        readStateFilter,
        isNil(after) ? undefined : lt(databaseSchema.articlesTable.id, after)
      )
    )
    .orderBy(desc(databaseSchema.articlesTable.id))
    .limit(limit);

  const hasNextPage = articles.length > first;
  const items = articles.slice(0, first);

  return createConnection(
    map(items, (article) => {
      const {
        feedId: articleFeedId,
        feedTitle,
        isRead: articleIsRead,
        ...rest
      } = article;
      return {
        __typename: "Article" as const,
        ...rest,
        feed: isNil(feedTitle)
          ? undefined
          : { id: articleFeedId, title: feedTitle },
        isRead: articleIsRead ?? false
      };
    }),
    hasNextPage
  );
};
