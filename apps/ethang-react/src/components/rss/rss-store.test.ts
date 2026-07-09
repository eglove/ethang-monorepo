import { beforeEach, describe, expect, it } from "vitest";

import { rssStore, rssStoreActions } from "./rss-store.ts";

describe("RssStore", () => {
  beforeEach(() => {
    rssStoreActions.setSelectedFeedId(null);
    rssStoreActions.cancelUnsubscribe();
  });

  it("should initialize with null selectedFeedId", () => {
    expect(rssStore.state.selectedFeedId).toBeNull();
  });

  it("should set selectedFeedId correctly", () => {
    rssStoreActions.setSelectedFeedId("test-feed-id-123");
    expect(rssStore.state.selectedFeedId).toBe("test-feed-id-123");

    rssStoreActions.setSelectedFeedId(null);
    expect(rssStore.state.selectedFeedId).toBeNull();
  });

  it("should initialize with null pendingUnsubscribe", () => {
    expect(rssStore.state.pendingUnsubscribe).toBeNull();
  });

  it("should set pendingUnsubscribe when requestUnsubscribe is called", () => {
    rssStoreActions.requestUnsubscribe("feed-1", "My Feed");
    expect(rssStore.state.pendingUnsubscribe).toEqual({
      feedId: "feed-1",
      title: "My Feed"
    });
  });

  it("should clear pendingUnsubscribe when cancelUnsubscribe is called", () => {
    rssStoreActions.requestUnsubscribe("feed-1", "My Feed");
    rssStoreActions.cancelUnsubscribe();
    expect(rssStore.state.pendingUnsubscribe).toBeNull();
  });
});
