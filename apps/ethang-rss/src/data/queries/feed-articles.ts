import { and, desc, eq, lt } from "drizzle-orm";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import slice from "lodash/slice.js";

import type { User } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";
import { combineFilters } from "../util/combine-filters.ts";
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
    isRead: isRead ?? null
  });
  const paginationFilter = isNil(after)
    ? null
    : lt(databaseSchema.articlesTable.id, after);
  const articleFilter = combineFilters(readStateFilter, paginationFilter);

  const articles = await database
    .select({
      content: databaseSchema.articlesTable.content,
      feedIconUrl: databaseSchema.feedsTable.iconUrl,
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
      combineFilters(
        eq(databaseSchema.articlesTable.feedId, feedId),
        articleFilter ?? null
        // eslint-disable-next-line no-undefined
      ) ?? undefined
    )
    .orderBy(desc(databaseSchema.articlesTable.id))
    .limit(limit);

  const hasNextPage = articles.length > first;
  const items = slice(articles, 0, first);

  return createConnection(
    map(items, (article) => {
      const {
        feedIconUrl,
        feedId: articleFeedId,
        feedTitle,
        isRead: articleIsRead,
        ...rest
      } = article;
      return {
        __typename: "Article" as const,
        ...rest,
        feed: isNil(feedTitle)
          ? null
          : { iconUrl: feedIconUrl, id: articleFeedId, title: feedTitle },
        isRead: articleIsRead ?? false
      };
    }),
    hasNextPage
  );
};
