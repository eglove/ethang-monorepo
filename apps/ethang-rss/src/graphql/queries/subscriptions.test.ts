import { describe, expect, it, vi } from "vitest";

import { subscriptionsQuery } from "./subscriptions.ts";

const lastFetchedAt1 = "2026-01-01T00:00:00.000Z";
const lastFetchedAt2 = "2026-01-02T00:00:00.000Z";
const website1 = "https://feed1.com";
const xmlAddress1 = "https://feed1.com/rss";
const website2 = "https://feed2.com";
const xmlAddress2 = "https://feed2.com/rss";

const mockUserContext = {
  feedLoader: {
    loadMany: vi.fn()
  },
  user: {
    sub: "user-1"
  }
};

describe("subscriptionsQuery", () => {
  it("should query subscriptions and return feed connections", async () => {
    const mockSubscriptions = [
      { feedId: "feed-1", id: "sub-1" },
      { feedId: "feed-2", id: "sub-2" }
    ];
    const mockFeeds = [
      {
        id: "feed-1",
        lastFetchedAt: lastFetchedAt1,
        title: "Feed 1",
        website: website1,
        xmlAddress: xmlAddress1
      },
      {
        id: "feed-2",
        lastFetchedAt: lastFetchedAt2,
        title: "Feed 2",
        website: website2,
        xmlAddress: xmlAddress2
      }
    ];

    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockSubscriptions),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);
    const result = await resolver(
      undefined,
      {},
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges.length).toBe(2);
    expect(result.pageInfo.hasNextPage).toBe(false);
    expect(result.edges[0]?.cursor).toBe("sub-1");
    expect(result.edges[0]?.node.title).toBe("Feed 1");
    expect(result.pageInfo.startCursor).toBe("sub-1");
    expect(result.pageInfo.endCursor).toBe("sub-2");
  });

  it("should support after cursor and pagination limits", async () => {
    const mockSubscriptions = [
      { feedId: "feed-1", id: "sub-1" },
      { feedId: "feed-2", id: "sub-2" },
      { feedId: "feed-3", id: "sub-3" }
    ];
    const mockFeeds = [
      {
        id: "feed-1",
        lastFetchedAt: lastFetchedAt1,
        title: "Feed 1",
        website: website1,
        xmlAddress: xmlAddress1
      },
      {
        id: "feed-2",
        lastFetchedAt: lastFetchedAt2,
        title: "Feed 2",
        website: website2,
        xmlAddress: xmlAddress2
      }
    ];

    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockSubscriptions),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);
    const result = await resolver(
      undefined,
      { after: "sub-0", first: 2 },
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges.length).toBe(2);
    expect(result.pageInfo.hasNextPage).toBe(true);
    expect(result.edges[0]?.cursor).toBe("sub-1");
    expect(result.pageInfo.endCursor).toBe("sub-2");
  });

  it("should throw an error if feedLoader returns an Error instance", async () => {
    const mockSubscriptions = [{ feedId: "feed-1", id: "sub-1" }];
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockSubscriptions),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    mockUserContext.feedLoader.loadMany.mockResolvedValue([
      new Error("load failed")
    ]);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);

    await expect(
      resolver(
        undefined,
        {},
        // @ts-expect-error test double
        mockUserContext
      )
    ).rejects.toThrow("Unexpected error occurred.");
  });

  it("should throw an error if feedLoader returns a nullish value", async () => {
    const mockSubscriptions = [{ feedId: "feed-1", id: "sub-1" }];
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockSubscriptions),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    mockUserContext.feedLoader.loadMany.mockResolvedValue([null]);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);

    await expect(
      resolver(
        undefined,
        {},
        // @ts-expect-error test double
        mockUserContext
      )
    ).rejects.toThrow("Unexpected error occurred.");
  });

  it("should return empty connections if no subscriptions are returned", async () => {
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    mockUserContext.feedLoader.loadMany.mockResolvedValue([]);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);
    const result = await resolver(
      undefined,
      {},
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges.length).toBe(0);
    expect(result.pageInfo.hasNextPage).toBe(false);
    expect(result.pageInfo.startCursor).toBeNull();
    expect(result.pageInfo.endCursor).toBeNull();
  });

  it("should handle missing subscription IDs or empty items gracefully", async () => {
    const mockSubscriptions = [{ feedId: "feed-1" }];
    const mockFeeds = [
      {
        id: "feed-1",
        lastFetchedAt: lastFetchedAt1,
        title: "Feed 1",
        website: website1,
        xmlAddress: xmlAddress1
      },
      {
        id: "feed-2",
        lastFetchedAt: lastFetchedAt2,
        title: "Feed 2",
        website: website2,
        xmlAddress: xmlAddress2
      }
    ];

    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockSubscriptions),
        orderBy: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis()
      })
    };

    mockUserContext.feedLoader.loadMany.mockResolvedValue(mockFeeds);

    // @ts-expect-error test double
    const resolver = subscriptionsQuery(mockDatabase);
    const result = await resolver(
      undefined,
      {},
      // @ts-expect-error test double
      mockUserContext
    );

    expect(result.edges.length).toBe(2);
    expect(result.edges[0]?.cursor).toBe("");
    expect(result.edges[1]?.cursor).toBe("");
  });
});
