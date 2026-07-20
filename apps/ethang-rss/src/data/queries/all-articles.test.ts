import { SQLiteSyncDialect } from "drizzle-orm/sqlite-core";
import { Encoding } from "effect";
import { describe, expect, it, vi } from "vitest";

import { encodeCursor } from "../util/cursor.ts";
import { allArticlesQuery } from "./all-articles.ts";

const FEED_ID_1 = "feed-1";
const FEED_ID_2 = "feed-2";
const USER_ID_1 = "user-1";
const PUBLISHED_AT_1 = "2026-06-15T10:00:00.000Z";
const PUBLISHED_AT_2 = "2026-06-15T09:00:00.000Z";
const ARTICLE_TITLE_1 = "Article 1";
const ARTICLE_TITLE_2 = "Article 2";

const mockContext = {
  user: {
    email: "user@test.com",
    exp: 123,
    iat: 123,
    sub: USER_ID_1,
    username: "user1"
  }
};

describe("allArticlesQuery - basic query path", () => {
  it("should query articles and return flat connection (simple path, no filters, no after)", async () => {
    const mockArticles = [
      {
        feedId: FEED_ID_1,
        id: "1",
        publishedAt: PUBLISHED_AT_1,
        title: ARTICLE_TITLE_1
      },
      {
        feedId: FEED_ID_2,
        id: "2",
        publishedAt: PUBLISHED_AT_2,
        title: ARTICLE_TITLE_2
      }
    ];

    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockArticles),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    const result = await allArticlesQuery(
      // @ts-expect-error test double
      mockDatabase,
      { first: 2 },
      mockContext
    );

    expect(result.edges).toHaveLength(2);
    expect(result.pageInfo.hasNextPage).toBe(false);
    expect(result.edges[0]?.node.title).toBe(ARTICLE_TITLE_1);
    expect(result.edges[0]?.cursor).toBe(encodeCursor([PUBLISHED_AT_1, "1"]));
  });
});

describe("allArticlesQuery - filtering", () => {
  it("should not append an empty pagination condition for unread articles", async () => {
    let whereSql = "";
    const dialect = new SQLiteSyncDialect();
    const articleQuery = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      orderBy: vi.fn().mockReturnThis(),
      where: vi.fn()
    };
    articleQuery.where.mockImplementation((condition) => {
      whereSql = dialect.sqlToQuery(condition.getSQL()).sql;
      return articleQuery;
    });
    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnValue({})
        })
        .mockReturnValueOnce(articleQuery)
    };

    await allArticlesQuery(
      // @ts-expect-error test double
      mockDatabase,
      { isRead: false },
      mockContext
    );

    expect(whereSql).not.toContain("and )");
  });

  it("should filter by isRead = true", async () => {
    const mockArticles = [
      {
        feedId: FEED_ID_1,
        id: "1",
        publishedAt: PUBLISHED_AT_1,
        title: ARTICLE_TITLE_1
      }
    ];
    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnValue({})
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue(mockArticles),
          orderBy: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis()
        })
    };

    const result = await allArticlesQuery(
      // @ts-expect-error test double
      mockDatabase,
      { isRead: true },
      mockContext
    );

    expect(result.edges).toHaveLength(1);
    expect(mockDatabase.select).toHaveBeenCalledTimes(2);
  });

  it("should filter by isRead = false", async () => {
    const mockArticles = [
      {
        feedId: FEED_ID_1,
        id: "1",
        publishedAt: PUBLISHED_AT_1,
        title: ARTICLE_TITLE_1
      }
    ];
    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnValue({})
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue(mockArticles),
          orderBy: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis()
        })
    };

    const result = await allArticlesQuery(
      // @ts-expect-error test double
      mockDatabase,
      { isRead: false },
      mockContext
    );

    expect(result.edges).toHaveLength(1);
    expect(mockDatabase.select).toHaveBeenCalledTimes(2);
  });
});

describe("allArticlesQuery - pagination and cursors", () => {
  it("should handle after cursor and hasNextPage = true", async () => {
    const mockArticles = [
      {
        feedId: FEED_ID_1,
        id: "2",
        publishedAt: PUBLISHED_AT_2,
        title: ARTICLE_TITLE_2
      },
      {
        feedId: FEED_ID_1,
        id: "1",
        publishedAt: "2026-06-15T08:00:00.000Z",
        title: ARTICLE_TITLE_1
      }
    ];

    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockArticles),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    const result = await allArticlesQuery(
      // @ts-expect-error test double
      mockDatabase,
      {
        after: encodeCursor([PUBLISHED_AT_1, "3"]),
        first: 1
      },
      mockContext
    );

    expect(result.edges).toHaveLength(1);
    expect(result.pageInfo.hasNextPage).toBe(true);
    expect(result.edges[0]?.node.id).toBe("2");
  });

  it("should handle cursor with null publishedAt", async () => {
    const mockArticles = [
      {
        feedId: FEED_ID_1,
        id: "1",
        publishedAt: null,
        title: ARTICLE_TITLE_1
      }
    ];
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockArticles),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    const result = await allArticlesQuery(
      // @ts-expect-error test double
      mockDatabase,
      {
        after: encodeCursor([null, "3"]),
        first: 1
      },
      mockContext
    );
    expect(result.edges).toHaveLength(1);
  });
});

describe("allArticlesQuery - feed title behavior", () => {
  it("should include feed object when feedTitle is present", async () => {
    const mockArticles = [
      {
        feedIconUrl: "https://example.com/icon.png",
        feedId: FEED_ID_1,
        feedTitle: "Test Feed",
        id: "1",
        publishedAt: PUBLISHED_AT_1,
        title: ARTICLE_TITLE_1
      }
    ];
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockArticles),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    const result = await allArticlesQuery(
      // @ts-expect-error test double
      mockDatabase,
      { first: 1 },
      mockContext
    );

    expect(result.edges[0]?.node.feed).toEqual({
      iconUrl: "https://example.com/icon.png",
      id: FEED_ID_1,
      title: "Test Feed"
    });
  });
});

describe("allArticlesQuery - validation error paths", () => {
  it("should handle invalid base64 cursor", async () => {
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };
    const result = await allArticlesQuery(
      // @ts-expect-error test double
      mockDatabase,
      { after: "invalid-base64!!" },
      mockContext
    );
    expect(result.edges).toHaveLength(0);
  });

  it("should handle invalid JSON in cursor", async () => {
    const invalidJsonBase64 = Encoding.encodeBase64("abc{");
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };
    const result = await allArticlesQuery(
      // @ts-expect-error test double
      mockDatabase,
      { after: invalidJsonBase64 },
      mockContext
    );
    expect(result.edges).toHaveLength(0);
  });

  it("should handle invalid cursor array shape", async () => {
    const invalidShapeBase64 = Encoding.encodeBase64(
      JSON.stringify(["only-one-item"])
    );
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };
    const result = await allArticlesQuery(
      // @ts-expect-error test double
      mockDatabase,
      { after: invalidShapeBase64 },
      mockContext
    );
    expect(result.edges).toHaveLength(0);
  });

  it("should handle cursor array where first element is not a string or null", async () => {
    const invalidElementBase64 = Encoding.encodeBase64(
      JSON.stringify([123, "some-id"])
    );
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };
    const result = await allArticlesQuery(
      // @ts-expect-error test double
      mockDatabase,
      { after: invalidElementBase64 },
      mockContext
    );
    expect(result.edges).toHaveLength(0);
  });

  it("should handle cursor array where second element is not a string", async () => {
    const invalidSecondBase64 = Encoding.encodeBase64(
      JSON.stringify(["published-at", 123])
    );
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };
    const result = await allArticlesQuery(
      // @ts-expect-error test double
      mockDatabase,
      { after: invalidSecondBase64 },
      mockContext
    );
    expect(result.edges).toHaveLength(0);
  });
});
