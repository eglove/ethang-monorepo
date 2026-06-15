import { beforeEach, describe, expect, it } from "vitest";

import { rssStore } from "./rss-store.ts";

describe("RssStore", () => {
  beforeEach(() => {
    rssStore.reset();
  });

  it("should initialize with null selectedFeedId", () => {
    expect(rssStore.state.selectedFeedId).toBeNull();
  });

  it("should set selectedFeedId correctly", () => {
    rssStore.setSelectedFeedId("test-feed-id-123");
    expect(rssStore.state.selectedFeedId).toBe("test-feed-id-123");

    rssStore.setSelectedFeedId(null);
    expect(rssStore.state.selectedFeedId).toBeNull();
  });
});
