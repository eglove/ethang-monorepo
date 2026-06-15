import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Feeds } from "./feeds.tsx";
import { rssStore } from "./rss-store.ts";

let mockQueryData: unknown = null;
let mockQueryPending = false;
let mockIsFetchingNextPage = false;
let mockSelectedFeedId: null | string = null;
const mockFetchNextPage = vi.fn().mockResolvedValue({});

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // @ts-expect-error for test
    ...actual,
    useInfiniteQuery: () => {
      let hasNextPage = false;
      if (null !== mockQueryData) {
        const { pages } = mockQueryData as {
          pages: { subscriptions: { pageInfo: { hasNextPage: boolean } } }[];
        };
        hasNextPage = pages[0]?.subscriptions.pageInfo.hasNextPage ?? false;
      }
      return {
        data: mockQueryData,
        fetchNextPage: mockFetchNextPage,
        hasNextPage,
        isFetchingNextPage: mockIsFetchingNextPage,
        isPending: mockQueryPending
      };
    }
  };
});

vi.mock("@ethang/store/use-store", () => {
  return {
    useStore: <T, U>(
      _store: T,
      selector: (state: { selectedFeedId: null | string }) => U
    ): U => {
      return selector({ selectedFeedId: mockSelectedFeedId });
    }
  };
});

vi.mock("./rss-store.ts", () => {
  return {
    rssStore: {
      setSelectedFeedId: vi.fn()
    }
  };
});

const ALPHA_FEED_TITLE = "Alpha Feed";
const BETA_FEED_TITLE = "Beta Feed";

describe("Feeds", () => {
  beforeEach(() => {
    mockQueryData = null;
    mockQueryPending = false;
    mockIsFetchingNextPage = false;
    mockSelectedFeedId = null;
    mockFetchNextPage.mockClear();
    vi.mocked(rssStore.setSelectedFeedId).mockClear();
  });

  it("renders a loading skeleton when loading and data is nil", () => {
    mockQueryPending = true;
    render(<Feeds />);

    expect(screen.getByTestId("sidebar-skeleton")).toBeDefined();
  });

  it("renders sorted feeds when data is present", () => {
    mockQueryData = {
      pages: [
        {
          subscriptions: {
            edges: [
              { node: { id: "feed-b", title: BETA_FEED_TITLE } },
              { node: { id: "feed-a", title: ALPHA_FEED_TITLE } }
            ],
            pageInfo: { endCursor: null, hasNextPage: false }
          }
        }
      ]
    };

    render(<Feeds />);

    expect(screen.getByRole("button", { name: "All Feeds" })).toBeDefined();

    const buttons = screen.getAllByRole("button");
    expect(buttons[1]?.textContent).toBe(ALPHA_FEED_TITLE);
    expect(buttons[2]?.textContent).toBe(BETA_FEED_TITLE);
  });

  it("calls setSelectedFeedId(null) when All Feeds is clicked", () => {
    mockQueryData = {
      pages: [
        {
          subscriptions: {
            edges: [{ node: { id: "feed-a", title: ALPHA_FEED_TITLE } }],
            pageInfo: { endCursor: null, hasNextPage: false }
          }
        }
      ]
    };
    mockSelectedFeedId = "feed-a";

    render(<Feeds />);

    const allFeedsButton = screen.getByRole("button", { name: "All Feeds" });
    fireEvent.click(allFeedsButton);

    expect(rssStore.setSelectedFeedId).toHaveBeenCalledWith(null);
  });

  it("calls setSelectedFeedId(feed.id) when a feed button is clicked", () => {
    mockQueryData = {
      pages: [
        {
          subscriptions: {
            edges: [{ node: { id: "feed-a", title: ALPHA_FEED_TITLE } }],
            pageInfo: { endCursor: null, hasNextPage: false }
          }
        }
      ]
    };

    render(<Feeds />);

    const feedButton = screen.getByRole("button", { name: ALPHA_FEED_TITLE });
    fireEvent.click(feedButton);

    expect(rssStore.setSelectedFeedId).toHaveBeenCalledWith("feed-a");
  });

  it("renders a Load More button when hasNextPage is true", () => {
    mockQueryData = {
      pages: [
        {
          subscriptions: {
            edges: [{ node: { id: "feed-a", title: ALPHA_FEED_TITLE } }],
            pageInfo: { endCursor: "cursor-a", hasNextPage: true }
          }
        }
      ]
    };

    render(<Feeds />);

    expect(screen.getByRole("button", { name: "Load More" })).toBeDefined();
  });

  it("calls fetchMore when Load More is clicked", () => {
    mockQueryData = {
      pages: [
        {
          subscriptions: {
            edges: [{ node: { id: "feed-a", title: ALPHA_FEED_TITLE } }],
            pageInfo: { endCursor: "cursor-a", hasNextPage: true }
          }
        }
      ]
    };

    render(<Feeds />);

    const loadMoreButton = screen.getByRole("button", { name: "Load More" });
    fireEvent.click(loadMoreButton);

    expect(mockFetchNextPage).toHaveBeenCalled();
  });
});
