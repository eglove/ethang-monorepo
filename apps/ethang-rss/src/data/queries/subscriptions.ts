import { and, desc, eq, gt, lt, or, sql, type SQLWrapper } from "drizzle-orm";
import { Effect } from "effect";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import slice from "lodash/slice.js";

import type { User } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";
import { decodeCursor, encodeCursor } from "../util/cursor.ts";

const getCursorParameters = async (after: null | string) => {
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
  after: null | string,
  limit: number
) => {
  return database
    .select({
      feedId: databaseSchema.subscriptionsTable.feedId,
      iconUrl: databaseSchema.feedsTable.iconUrl,
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
        isNil(after) ? sql`` : lt(databaseSchema.subscriptionsTable.id, after)
      )
    )
    .orderBy(desc(databaseSchema.subscriptionsTable.id))
    .limit(limit);
};

const getTitleSortedSubscriptions = async (
  database: Database,
  userId: string,
  after: null | string,
  direction: "ASC" | "DESC",
  limit: number
) => {
  const [lastTitle, lastId] = await getCursorParameters(after);

  const subquery = database
    .select({
      feedId: databaseSchema.subscriptionsTable.feedId,
      iconUrl: databaseSchema.feedsTable.iconUrl,
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
    : null;

  const orderBySql =
    "DESC" === direction
      ? sql`${subquery.title} DESC, ${subquery.id} DESC`
      : sql`${subquery.title} ASC, ${subquery.id} ASC`;

  const baseQuery = database.select().from(subquery);
  const filteredQuery = isNil(whereCondition)
    ? baseQuery
    : baseQuery.where(whereCondition);

  return filteredQuery.orderBy(orderBySql).limit(limit);
};

const getPublishedAtSortedSubscriptions = async (
  database: Database,
  userId: string,
  after: null | string,
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
      iconUrl: databaseSchema.feedsTable.iconUrl,
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
    : null;

  const orderBySql =
    "DESC" === direction
      ? sql`${subquery.maxPublishedAt} DESC, ${subquery.id} DESC`
      : sql`${subquery.maxPublishedAt} ASC, ${subquery.id} ASC`;

  const baseQuery = database.select().from(subquery);
  const filteredQuery = isNil(whereCondition)
    ? baseQuery
    : baseQuery.where(whereCondition);

  return filteredQuery.orderBy(orderBySql).limit(limit);
};

const getItemCursor = (
  item: {
    id?: null | string;
    maxPublishedAt?: null | string;
    title?: null | string;
  } | null,
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
    iconUrl: null | string;
    id?: null | string;
    lastFetchedAt: null | string;
    maxPublishedAt?: null | string;
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
        iconUrl: item.iconUrl,
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
    after?: null | string;
    first?: number;
    sortBy?: {
      direction: "ASC" | "DESC";
      field: "PUBLISHED_AT" | "TITLE";
    };
  },
  user: User
) => {
  const { after = null, first = 20, sortBy } = parameters;
  const limit = first + 1;

  let subscriptions: {
    feedId: string;
    iconUrl: null | string;
    id?: null | string;
    lastFetchedAt: null | string;
    maxPublishedAt?: null | string;
    title: string;
    website: string;
    xmlAddress: string;
  }[];

  if (isNil(sortBy)) {
    subscriptions = await getDefaultSubscriptions(
      database,
      user.sub,
      after,
      limit
    );
  } else if ("TITLE" === sortBy.field) {
    subscriptions = await getTitleSortedSubscriptions(
      database,
      user.sub,
      after,
      sortBy.direction,
      limit
    );
  } else {
    subscriptions = await getPublishedAtSortedSubscriptions(
      database,
      user.sub,
      after,
      sortBy.direction,
      limit
    );
  }

  const hasNextPage = subscriptions.length > first;
  const items = slice(subscriptions, 0, first);

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
