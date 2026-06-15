import { describe, expect, it, vi } from "vitest";

import { subscriptionQuery } from "./subscription.ts";

const mockFeed = { id: "feed-1", title: "Test Feed" };

const mockContext = {
  feedLoader: {
    load: vi.fn().mockResolvedValue(mockFeed)
  }
};

describe("subscriptionQuery", () => {
  it("should select feed and load it via feedLoader", async () => {
    const mockDatabase = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockFeed]),
        where: vi.fn().mockReturnThis()
      })
    };

    // @ts-expect-error test double
    const resolver = subscriptionQuery(mockDatabase);
    const result = await resolver(
      undefined,
      { feedId: "feed-1" },
      // @ts-expect-error test double
      mockContext
    );

    expect(result).toStrictEqual(mockFeed);
    expect(mockDatabase.select).toHaveBeenCalled();
    expect(mockContext.feedLoader.load).toHaveBeenCalledWith("feed-1");
  });
});
