import { describe, expect, it, vi } from "vitest";

import { createFeedLoader } from "./feed-loader.ts";

describe("feedLoader", () => {
  it("loads feeds by id", async () => {
    const mockFeeds = [
      { id: "1", title: "Feed 1" },
      { id: "2", title: "Feed 2" }
    ];

    const mockWhere = vi.fn().mockReturnValue(Promise.resolve(mockFeeds));
    const mockFrom = vi.fn().mockReturnValue({
      where: mockWhere
    });
    const mockSelect = vi.fn().mockReturnValue({
      from: mockFrom
    });

    const mockDatabase = {
      select: mockSelect
    };

    // @ts-expect-error test
    const loader = createFeedLoader(mockDatabase);
    const result = await loader.loadMany(["1", "2", "3"]);

    expect(result[0]).toEqual(mockFeeds[0]);
    expect(result[1]).toEqual(mockFeeds[1]);
    expect(result[2]).toBeNull();
  });
});
