import { and, desc, eq, gt, lt, or, sql, type SQLWrapper } from "drizzle-orm";
import isArray from "lodash/isArray.js";
import isError from "lodash/isError.js";
import isFunction from "lodash/isFunction.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import { Buffer } from "node:buffer";

import type { ServerContext } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";

type SelectFeed = {
  id: string;
  lastFetchedAt: null | string;
  title: string;
  website: string;
  xmlAddress: string;
};

type Uint8ArrayConstructorWithBase64 = {
  fromBase64?: (base64: string) => Uint8Array;
} & typeof Uint8Array;

type Uint8ArrayWithBase64 = {
  toBase64?: () => string;
} & Uint8Array;

const encodeCursor = (value: [string, string]) => {
  const json = JSON.stringify(value);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(json) as Uint8ArrayWithBase64;

  if (isFunction(bytes.toBase64)) {
    return bytes.toBase64();
  }
  // eslint-disable-next-line unicorn/prefer-uint8array-base64
  return Buffer.from(bytes).toString("base64");
};

const decodeBase64ToBytes = (cursor: string) => {
  const ctor = Uint8Array as Uint8ArrayConstructorWithBase64;

  if (isFunction(ctor.fromBase64)) {
    return ctor.fromBase64(cursor);
  }
  // eslint-disable-next-line unicorn/prefer-uint8array-base64
  return new Uint8Array(Buffer.from(cursor, "base64"));
};

const safeDecode = (cursor: string) => {
  const bytes = decodeBase64ToBytes(cursor);
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
};

const decodeCursor = (cursor: string) => {
  let json = "";
  try {
    json = safeDecode(cursor);
  } catch {
    return null;
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(json);
  } catch {
    return null;
  }

  if (isArray(decoded) && 2 === decoded.length) {
    const array: unknown[] = decoded;
    const [firstValue, secondValue] = array;
    if (isString(firstValue) && isString(secondValue)) {
      return [firstValue, secondValue];
    }
  }
  return null;
};

const getCursorParameters = (after: string | undefined) => {
  if (isNil(after)) {
    return [null, null] as const;
  }
  const decoded = decodeCursor(after);
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
      id: databaseSchema.subscriptionsTable.id
    })
    .from(databaseSchema.subscriptionsTable)
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
  const [lastTitle, lastId] = getCursorParameters(after);

  const subquery = database
    .select({
      feedId: databaseSchema.subscriptionsTable.feedId,
      id: databaseSchema.subscriptionsTable.id,
      title: databaseSchema.feedsTable.title
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
  const [lastPublishedAt, lastId] = getCursorParameters(after);

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
      maxPublishedAt: maxPublishedAtSql.as("maxPublishedAt")
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

const isValidFeed = (feed: unknown): feed is SelectFeed => {
  return !isNil(feed) && !isError(feed);
};

const buildEdges = (
  feeds: unknown[],
  items: {
    feedId: string;
    id?: string;
    maxPublishedAt?: string;
    title?: string;
  }[],
  sortBy?: {
    direction: "ASC" | "DESC";
    field: "PUBLISHED_AT" | "TITLE";
  }
) => {
  return map(feeds, (feed, index) => {
    if (!isValidFeed(feed)) {
      throw new Error("Unexpected error occurred.");
    }

    return {
      cursor: getItemCursor(items[index], sortBy),
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
};

export const subscriptionsQuery = (database: Database) => {
  return async (
    _parent: unknown,
    parameters: {
      after?: string;
      first?: number;
      sortBy?: {
        direction: "ASC" | "DESC";
        field: "PUBLISHED_AT" | "TITLE";
      };
    },
    context: ServerContext
  ) => {
    const { after, first = 20, sortBy } = parameters;
    const limit = first + 1;

    let items: {
      feedId: string;
      id?: string;
      maxPublishedAt?: string;
      title?: string;
    }[] = [];
    let hasNextPage = false;

    if (isNil(sortBy)) {
      const subscriptions = await getDefaultSubscriptions(
        database,
        context.user.sub,
        after,
        limit
      );
      hasNextPage = subscriptions.length > first;
      items = subscriptions.slice(0, first);
    } else {
      const { direction, field } = sortBy;
      if ("TITLE" === field) {
        const subscriptions = await getTitleSortedSubscriptions(
          database,
          context.user.sub,
          after,
          direction,
          limit
        );
        hasNextPage = subscriptions.length > first;
        items = subscriptions.slice(0, first);
      } else {
        const subscriptions = await getPublishedAtSortedSubscriptions(
          database,
          context.user.sub,
          after,
          direction,
          limit
        );
        hasNextPage = subscriptions.length > first;
        items = subscriptions.slice(0, first);
      }
    }

    const feeds = await context.feedLoader.loadMany(
      map(items, (result) => {
        return result.feedId;
      })
    );

    const edges = buildEdges(feeds, items, sortBy);

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
