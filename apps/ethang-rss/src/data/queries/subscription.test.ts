import { describe, expect, it, vi } from "vitest";

import { subscriptionQuery } from "./subscription.ts";

const mockFeed = {
  id: "feed-1",
  lastFetchedAt: null,
  title: "Test Feed",
  website: "",
  xmlAddress: ""
};

describe("subscriptionQuery", () => {
  it("should select feed from database", async () => {
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockFeed]),
        where: vi.fn().mockReturnThis()
      })
    };

    // @ts-expect-error test double
    const result = await subscriptionQuery(mockDatabase, { feedId: "feed-1" });

    expect(result).toStrictEqual(mockFeed);
    expect(mockDatabase.select).toHaveBeenCalled();
  });

  it("should return null when feed not found", async () => {
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
        where: vi.fn().mockReturnThis()
      })
    };

    // @ts-expect-error test double
    const result = await subscriptionQuery(mockDatabase, { feedId: "missing" });

    expect(result).toBeNull();
  });
});
