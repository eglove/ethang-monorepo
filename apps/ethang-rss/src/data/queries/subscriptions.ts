import { and, desc, eq, gt, lt, or, sql, type SQLWrapper } from "drizzle-orm";
import { Effect } from "effect";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import type { User } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";
import { decodeCursor, encodeCursor } from "../util/cursor.ts";

const getCursorParameters = async (after: string | undefined) => {
  if (isNil(after)) {
    return [null, null] as const;
  }
  const decoded = await Effect.runPromise(decodeCursor(after));
  if (isNil(decoded)) {
    return [null, null] as const;
  }
  return decoded;
};

const getSortWhereCondition = (
  field: SQLWrapper,
  idColumn: SQLWrapper,
  lastValue: string,
  lastId: string,
  direction: "ASC" | "DESC"
) => {
  const eqField = eq(field, lastValue);

  if ("DESC" === direction) {
    const ltId = lt(idColumn, lastId);
    const andLt = and(eqField, ltId);
    const ltField = lt(field, lastValue);
    return or(ltField, andLt);
  }

  const gtId = gt(idColumn, lastId);
  const andGt = and(eqField, gtId);
  const gtField = gt(field, lastValue);
  return or(gtField, andGt);
};

const getDefaultSubscriptions = async (
  database: Database,
  userId: string,
  after: string | undefined,
  limit: number
) => {
  return database
    .select({
      feedId: databaseSchema.subscriptionsTable.feedId,
      id: databaseSchema.subscriptionsTable.id,
      lastFetchedAt: databaseSchema.feedsTable.lastFetchedAt,
      title: databaseSchema.feedsTable.title,
      website: databaseSchema.feedsTable.website,
      xmlAddress: databaseSchema.feedsTable.xmlAddress
    })
    .from(databaseSchema.subscriptionsTable)
    .innerJoin(
      databaseSchema.feedsTable,
      eq(databaseSchema.subscriptionsTable.feedId, databaseSchema.feedsTable.id)
    )
    .where(
      and(
        eq(databaseSchema.subscriptionsTable.userId, userId),
        isNil(after)
          ? undefined
          : lt(databaseSchema.subscriptionsTable.id, after)
      )
    )
    .orderBy(desc(databaseSchema.subscriptionsTable.id))
    .limit(limit);
};

const getTitleSortedSubscriptions = async (
  database: Database,
  userId: string,
  after: string | undefined,
  direction: "ASC" | "DESC",
  limit: number
) => {
  const [lastTitle, lastId] = await getCursorParameters(after);

  const subquery = database
    .select({
      feedId: databaseSchema.subscriptionsTable.feedId,
      id: databaseSchema.subscriptionsTable.id,
      lastFetchedAt: databaseSchema.feedsTable.lastFetchedAt,
      title: databaseSchema.feedsTable.title,
      website: databaseSchema.feedsTable.website,
      xmlAddress: databaseSchema.feedsTable.xmlAddress
    })
    .from(databaseSchema.subscriptionsTable)
    .innerJoin(
      databaseSchema.feedsTable,
      eq(databaseSchema.subscriptionsTable.feedId, databaseSchema.feedsTable.id)
    )
    .where(eq(databaseSchema.subscriptionsTable.userId, userId))
    .as("subquery");

  const hasCursor = !isNil(lastTitle) && !isNil(lastId);
  const whereCondition = hasCursor
    ? getSortWhereCondition(
        subquery.title,
        subquery.id,
        lastTitle,
        lastId,
        direction
      )
    : undefined;

  const orderBySql =
    "DESC" === direction
      ? sql`${subquery.title} DESC, ${subquery.id} DESC`
      : sql`${subquery.title} ASC, ${subquery.id} ASC`;

  return database
    .select()
    .from(subquery)
    .where(whereCondition)
    .orderBy(orderBySql)
    .limit(limit);
};

const getPublishedAtSortedSubscriptions = async (
  database: Database,
  userId: string,
  after: string | undefined,
  direction: "ASC" | "DESC",
  limit: number
) => {
  const [lastPublishedAt, lastId] = await getCursorParameters(after);

  const maxPublishedAtSql = sql<string>`coalesce(max(${
    databaseSchema.articlesTable.publishedAt
  }), ${
    "DESC" === direction
      ? "'1970-01-01T00:00:00.000Z'"
      : "'9999-12-31T23:59:59.999Z'"
  })`;

  const subquery = database
    .select({
      feedId: databaseSchema.subscriptionsTable.feedId,
      id: databaseSchema.subscriptionsTable.id,
      lastFetchedAt: databaseSchema.feedsTable.lastFetchedAt,
      maxPublishedAt: maxPublishedAtSql.as("maxPublishedAt"),
      title: databaseSchema.feedsTable.title,
      website: databaseSchema.feedsTable.website,
      xmlAddress: databaseSchema.feedsTable.xmlAddress
    })
    .from(databaseSchema.subscriptionsTable)
    .innerJoin(
      databaseSchema.feedsTable,
      eq(databaseSchema.subscriptionsTable.feedId, databaseSchema.feedsTable.id)
    )
    .leftJoin(
      databaseSchema.articlesTable,
      eq(databaseSchema.feedsTable.id, databaseSchema.articlesTable.feedId)
    )
    .where(eq(databaseSchema.subscriptionsTable.userId, userId))
    .groupBy(databaseSchema.subscriptionsTable.id)
    .as("subquery");

  const hasCursor = !isNil(lastPublishedAt) && !isNil(lastId);
  const whereCondition = hasCursor
    ? getSortWhereCondition(
        subquery.maxPublishedAt,
        subquery.id,
        lastPublishedAt,
        lastId,
        direction
      )
    : undefined;

  const orderBySql =
    "DESC" === direction
      ? sql`${subquery.maxPublishedAt} DESC, ${subquery.id} DESC`
      : sql`${subquery.maxPublishedAt} ASC, ${subquery.id} ASC`;

  return database
    .select()
    .from(subquery)
    .where(whereCondition)
    .orderBy(orderBySql)
    .limit(limit);
};

const getItemCursor = (
  item: { id?: string; maxPublishedAt?: string; title?: string } | undefined,
  sortBy?: { field: "PUBLISHED_AT" | "TITLE" }
) => {
  if (isNil(item)) {
    return "";
  }
  if (isNil(sortBy)) {
    return item.id ?? "";
  }
  const id = item.id ?? "";
  if ("TITLE" === sortBy.field) {
    const title = item.title ?? "";
    return encodeCursor([title, id]);
  }
  const maxPublishedAt = item.maxPublishedAt ?? "";
  return encodeCursor([maxPublishedAt, id]);
};

const buildEdges = (
  items: {
    feedId: string;
    id?: string;
    lastFetchedAt: null | string;
    maxPublishedAt?: string;
    title: string;
    website: string;
    xmlAddress: string;
  }[],
  sortBy?: {
    direction: "ASC" | "DESC";
    field: "PUBLISHED_AT" | "TITLE";
  }
) => {
  return map(items, (item) => {
    return {
      cursor: getItemCursor(item, sortBy),
      node: {
        __typename: "Feed" as const,
        id: item.feedId,
        lastFetchedAt: item.lastFetchedAt,
        title: item.title,
        website: item.website,
        xmlAddress: item.xmlAddress
      }
    };
  });
};

export const subscriptionsQuery = async (
  database: Database,
  parameters: {
    after?: string;
    first?: number;
    sortBy?: {
      direction: "ASC" | "DESC";
      field: "PUBLISHED_AT" | "TITLE";
    };
  },
  user: User
) => {
  const { after, first = 20, sortBy } = parameters;
  const limit = first + 1;

  let items: {
    feedId: string;
    id?: string;
    lastFetchedAt: null | string;
    maxPublishedAt?: string;
    title: string;
    website: string;
    xmlAddress: string;
  }[] = [];
  let hasNextPage = false;
  let subscriptions: typeof items;

  if (isNil(sortBy)) {
    subscriptions = await getDefaultSubscriptions(
      database,
      user.sub,
      after,
      limit
    );
  } else {
    const { direction, field } = sortBy;
    subscriptions =
      "TITLE" === field
        ? await getTitleSortedSubscriptions(
            database,
            user.sub,
            after,
            direction,
            limit
          )
        : await getPublishedAtSortedSubscriptions(
            database,
            user.sub,
            after,
            direction,
            limit
          );
  }

  hasNextPage = subscriptions.length > first;
  items = subscriptions.slice(0, first);

  const edges = buildEdges(items, sortBy);

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
