import { and, desc, eq, inArray, isNull, lt, not, or } from "drizzle-orm";
import isArray from "lodash/isArray.js";
import isFunction from "lodash/isFunction.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import { Buffer } from "node:buffer";

import type { ServerContext } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";

type Uint8ArrayConstructorWithBase64 = {
  fromBase64?: (base64: string) => Uint8Array;
} & typeof Uint8Array;

type Uint8ArrayWithBase64 = {
  toBase64?: () => string;
} & Uint8Array;

const encodeCursor = (value: [null | string, string]) => {
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
    if (
      (isString(firstValue) || null === firstValue) &&
      isString(secondValue)
    ) {
      return [firstValue, secondValue] as [null | string, string];
    }
  }
  return null;
};

export const allArticlesQuery = (database: Database) => {
  return async (
    _parent: unknown,
    parameters: {
      after?: string;
      first?: number;
      isRead?: boolean;
    },
    context: ServerContext
  ) => {
    const { after, first = 20, isRead } = parameters;
    const limit = first + 1;

    let readStateFilter;

    if (!isNil(isRead)) {
      const readArticleIds = database
        .select({
          articleId: databaseSchema.userItemStatesTable.articleId
        })
        .from(databaseSchema.userItemStatesTable)
        .where(
          and(
            eq(databaseSchema.userItemStatesTable.userId, context.user.sub),
            eq(databaseSchema.userItemStatesTable.isRead, true)
          )
        );

      readStateFilter = isRead
        ? inArray(databaseSchema.articlesTable.id, readArticleIds)
        : not(inArray(databaseSchema.articlesTable.id, readArticleIds));
    }

    let lastPublishedAt: null | string = null;
    let lastId: null | string = null;

    if (!isNil(after)) {
      const decoded = decodeCursor(after);
      if (!isNil(decoded)) {
        [lastPublishedAt, lastId] = decoded;
      }
    }

    let paginationFilter;
    if (!isNil(lastId)) {
      paginationFilter = isNil(lastPublishedAt)
        ? and(
            isNull(databaseSchema.articlesTable.publishedAt),
            lt(databaseSchema.articlesTable.id, lastId)
          )
        : or(
            lt(databaseSchema.articlesTable.publishedAt, lastPublishedAt),
            and(
              eq(databaseSchema.articlesTable.publishedAt, lastPublishedAt),
              lt(databaseSchema.articlesTable.id, lastId)
            ),
            isNull(databaseSchema.articlesTable.publishedAt)
          );
    }

    const articles = await database
      .select({
        content: databaseSchema.articlesTable.content,
        feedId: databaseSchema.articlesTable.feedId,
        guid: databaseSchema.articlesTable.guid,
        id: databaseSchema.articlesTable.id,
        link: databaseSchema.articlesTable.link,
        publishedAt: databaseSchema.articlesTable.publishedAt,
        title: databaseSchema.articlesTable.title
      })
      .from(databaseSchema.articlesTable)
      .innerJoin(
        databaseSchema.subscriptionsTable,
        and(
          eq(
            databaseSchema.articlesTable.feedId,
            databaseSchema.subscriptionsTable.feedId
          ),
          eq(databaseSchema.subscriptionsTable.userId, context.user.sub)
        )
      )
      .where(and(readStateFilter, paginationFilter))
      .orderBy(
        desc(databaseSchema.articlesTable.publishedAt),
        desc(databaseSchema.articlesTable.id)
      )
      .limit(limit);

    const hasNextPage = articles.length > first;
    const items = articles.slice(0, first);

    const edges = map(items, (article) => {
      return {
        cursor: encodeCursor([article.publishedAt, article.id]),
        node: {
          __typename: "Article" as const,
          ...article
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
