import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Feeds } from "./feeds.tsx";
import { rssStore } from "./rss-store.ts";

const mockFeedsStore = {
  isFetchingNextPage: false,
  isQueryPending: false,
  queryData: null as unknown,
  selectedFeedId: null as null | string
};
const mockFetchNextPage = vi.fn().mockResolvedValue({});

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // @ts-expect-error for test
    ...actual,
    useInfiniteQuery: () => {
      let hasNextPage = false;
      if (null !== mockFeedsStore.queryData) {
        const { pages } = mockFeedsStore.queryData as {
          pages: { pageInfo: { hasNextPage: boolean } }[];
        };
        hasNextPage = pages[0]?.pageInfo.hasNextPage ?? false;
      }
      return {
        data: mockFeedsStore.queryData,
        fetchNextPage: mockFetchNextPage,
        hasNextPage,
        isFetchingNextPage: mockFeedsStore.isFetchingNextPage,
        isPending: mockFeedsStore.isQueryPending
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
      return selector({ selectedFeedId: mockFeedsStore.selectedFeedId });
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
    mockFeedsStore.queryData = null;
    mockFeedsStore.isQueryPending = false;
    mockFeedsStore.isFetchingNextPage = false;
    mockFeedsStore.selectedFeedId = null;
    mockFetchNextPage.mockClear();
    vi.mocked(rssStore.setSelectedFeedId).mockClear();
  });

  it("renders a loading skeleton when loading and data is nil", () => {
    mockFeedsStore.isQueryPending = true;
    render(<Feeds />);

    expect(screen.getByTestId("sidebar-skeleton")).toBeDefined();
  });

  it("renders sorted feeds when data is present", () => {
    mockFeedsStore.queryData = {
      pages: [
        {
          edges: [
            { node: { id: "feed-b", title: BETA_FEED_TITLE } },
            { node: { id: "feed-a", title: ALPHA_FEED_TITLE } }
          ],
          pageInfo: { endCursor: null, hasNextPage: false }
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
    mockFeedsStore.queryData = {
      pages: [
        {
          edges: [{ node: { id: "feed-a", title: ALPHA_FEED_TITLE } }],
          pageInfo: { endCursor: null, hasNextPage: false }
        }
      ]
    };
    mockFeedsStore.selectedFeedId = "feed-a";

    render(<Feeds />);

    const allFeedsButton = screen.getByRole("button", { name: "All Feeds" });
    fireEvent.click(allFeedsButton);

    expect(rssStore.setSelectedFeedId).toHaveBeenCalledWith(null);
  });

  it("calls setSelectedFeedId(feed.id) when a feed button is clicked", () => {
    mockFeedsStore.queryData = {
      pages: [
        {
          edges: [{ node: { id: "feed-a", title: ALPHA_FEED_TITLE } }],
          pageInfo: { endCursor: null, hasNextPage: false }
        }
      ]
    };

    render(<Feeds />);

    const feedButton = screen.getByRole("button", { name: ALPHA_FEED_TITLE });
    fireEvent.click(feedButton);

    expect(rssStore.setSelectedFeedId).toHaveBeenCalledWith("feed-a");
  });

  it("renders a Load More button when hasNextPage is true", () => {
    mockFeedsStore.queryData = {
      pages: [
        {
          edges: [{ node: { id: "feed-a", title: ALPHA_FEED_TITLE } }],
          pageInfo: { endCursor: "cursor-a", hasNextPage: true }
        }
      ]
    };

    render(<Feeds />);

    expect(screen.getByRole("button", { name: "Load More" })).toBeDefined();
  });

  it("calls fetchMore when Load More is clicked", () => {
    mockFeedsStore.queryData = {
      pages: [
        {
          edges: [{ node: { id: "feed-a", title: ALPHA_FEED_TITLE } }],
          pageInfo: { endCursor: "cursor-a", hasNextPage: true }
        }
      ]
    };

    render(<Feeds />);

    const loadMoreButton = screen.getByRole("button", { name: "Load More" });
    fireEvent.click(loadMoreButton);

    expect(mockFetchNextPage).toHaveBeenCalled();
  });
});
