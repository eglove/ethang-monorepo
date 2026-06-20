import { describe, expect, it, vi } from "vitest";

import { feedArticlesQuery } from "./feed-articles.ts";

const mockContext = {
  user: {
    email: "user@test.com",
    exp: 123,
    iat: 123,
    sub: "user-1",
    username: "user1"
  }
};

describe("feedArticlesQuery", () => {
  it("should query articles and return paginated connection (simple path, no isRead, no after)", async () => {
    const mockArticles = [
      { feedId: "feed-1", id: "1", title: "Article 1" },
      { feedId: "feed-1", id: "2", title: "Article 2" }
    ];

    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockArticles),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    // @ts-expect-error test double
    const resolver = feedArticlesQuery(mockDatabase);
    const result = await resolver(
      undefined,
      { feedId: "feed-1", first: 2 },
      // @ts-expect-error test double
      mockContext
    );

    expect(result.edges).toHaveLength(2);
    expect(result.pageInfo.hasNextPage).toBe(false);
    expect(result.edges[0]?.node.title).toBe("Article 1");
  });

  it("should filter by isRead = true", async () => {
    const mockArticles = [{ feedId: "feed-1", id: "1", title: "Article 1" }];
    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnValue({})
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue(mockArticles),
          orderBy: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis()
        })
    };

    // @ts-expect-error test double
    const resolver = feedArticlesQuery(mockDatabase);
    const result = await resolver(
      undefined,
      { feedId: "feed-1", isRead: true },
      // @ts-expect-error test double
      mockContext
    );

    expect(result.edges).toHaveLength(1);
    expect(mockDatabase.select).toHaveBeenCalledTimes(2);
  });

  it("should filter by isRead = false", async () => {
    const mockArticles = [{ feedId: "feed-1", id: "1", title: "Article 1" }];
    const mockDatabase = {
      select: vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnValue({})
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue(mockArticles),
          orderBy: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis()
        })
    };

    // @ts-expect-error test double
    const resolver = feedArticlesQuery(mockDatabase);
    const result = await resolver(
      undefined,
      { feedId: "feed-1", isRead: false },
      // @ts-expect-error test double
      mockContext
    );

    expect(result.edges).toHaveLength(1);
    expect(mockDatabase.select).toHaveBeenCalledTimes(2);
  });

  it("should handle after cursor and hasNextPage = true", async () => {
    const mockArticles = [
      { feedId: "feed-1", id: "2", title: "Article 2" },
      { feedId: "feed-1", id: "1", title: "Article 1" }
    ];

    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockArticles),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    // @ts-expect-error test double
    const resolver = feedArticlesQuery(mockDatabase);
    const result = await resolver(
      undefined,
      { after: "3", feedId: "feed-1", first: 1 },
      // @ts-expect-error test double
      mockContext
    );

    expect(result.edges).toHaveLength(1);
    expect(result.pageInfo.hasNextPage).toBe(true);
    expect(result.edges[0]?.node.id).toBe("2");
  });
});
