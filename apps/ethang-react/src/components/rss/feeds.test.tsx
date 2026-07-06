import { fireEvent, render, screen } from "@testing-library/react";
import filter from "lodash/filter.js";
import map from "lodash/map.js";
import "@testing-library/jest-dom/vitest";
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
const mockRemoveSubscription = vi.fn().mockResolvedValue({ success: true });
const mockInvalidateQueries = vi.fn().mockResolvedValue({});

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
    },
    useMutation: ({
      onSuccess
    }: {
      onSuccess?: (
        data: unknown,
        variables: { feedId: string }
      ) => Promise<void>;
    }) => {
      return {
        mutateAsync: async (input: unknown) => {
          const result = await mockRemoveSubscription(input);
          if (undefined !== onSuccess) {
            await onSuccess(undefined, input as { feedId: string });
          }
          return result;
        }
      };
    },
    useQueryClient: () => {
      return {
        invalidateQueries: mockInvalidateQueries
      };
    }
  };
});

vi.mock("./queries.ts", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // @ts-expect-error for test
    ...actual,
    removeSubscriptionMutationFunction: vi.fn().mockResolvedValue({
      success: true
    })
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
const FEED_A_ID = "feed-a";
const FEED_B_ID = "feed-b";
const FEED_A_ICON_URL = "https://alpha.example.com/favicon.ico";
const FEED_B_ICON_URL = "https://beta.example.com/favicon.ico";
const FEED_A_WEBSITE = "https://alpha.example.com";
const FEED_B_WEBSITE = "https://beta.example.com";

describe("Feeds", () => {
  beforeEach(() => {
    mockFeedsStore.queryData = null;
    mockFeedsStore.isQueryPending = false;
    mockFeedsStore.isFetchingNextPage = false;
    mockFeedsStore.selectedFeedId = null;
    mockFetchNextPage.mockClear();
    mockRemoveSubscription.mockClear();
    mockInvalidateQueries.mockClear();
    vi.mocked(rssStore.setSelectedFeedId).mockClear();
    vi.spyOn(globalThis, "confirm").mockReset();
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
            { node: { id: FEED_B_ID, title: BETA_FEED_TITLE } },
            { node: { id: FEED_A_ID, title: ALPHA_FEED_TITLE } }
          ],
          pageInfo: { endCursor: null, hasNextPage: false }
        }
      ]
    };

    render(<Feeds />);

    expect(screen.getByRole("button", { name: "All Feeds" })).toBeDefined();

    expect(
      screen.getByRole("button", { name: ALPHA_FEED_TITLE })
    ).toBeDefined();
    expect(screen.getByRole("button", { name: BETA_FEED_TITLE })).toBeDefined();
  });

  it("calls setSelectedFeedId(null) when All Feeds is clicked", () => {
    mockFeedsStore.queryData = {
      pages: [
        {
          edges: [{ node: { id: FEED_A_ID, title: ALPHA_FEED_TITLE } }],
          pageInfo: { endCursor: null, hasNextPage: false }
        }
      ]
    };
    mockFeedsStore.selectedFeedId = FEED_A_ID;

    render(<Feeds />);

    const allFeedsButton = screen.getByRole("button", { name: "All Feeds" });
    fireEvent.click(allFeedsButton);

    expect(rssStore.setSelectedFeedId).toHaveBeenCalledWith(null);
  });

  it("calls setSelectedFeedId(feed.id) when a feed button is clicked", () => {
    mockFeedsStore.queryData = {
      pages: [
        {
          edges: [{ node: { id: FEED_A_ID, title: ALPHA_FEED_TITLE } }],
          pageInfo: { endCursor: null, hasNextPage: false }
        }
      ]
    };

    render(<Feeds />);

    const feedButton = screen.getByRole("button", { name: ALPHA_FEED_TITLE });
    fireEvent.click(feedButton);

    expect(rssStore.setSelectedFeedId).toHaveBeenCalledWith(FEED_A_ID);
  });

  it("renders a Load More button when hasNextPage is true", () => {
    mockFeedsStore.queryData = {
      pages: [
        {
          edges: [{ node: { id: FEED_A_ID, title: ALPHA_FEED_TITLE } }],
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
          edges: [{ node: { id: FEED_A_ID, title: ALPHA_FEED_TITLE } }],
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

describe("Feeds - Unsubscribe", () => {
  beforeEach(() => {
    mockFeedsStore.queryData = {
      pages: [
        {
          edges: [{ node: { id: FEED_A_ID, title: ALPHA_FEED_TITLE } }],
          pageInfo: { endCursor: null, hasNextPage: false }
        }
      ]
    };
    mockFeedsStore.selectedFeedId = null;
    mockRemoveSubscription.mockClear();
    mockInvalidateQueries.mockClear();
    vi.mocked(rssStore.setSelectedFeedId).mockClear();
  });

  it("renders an unsubscribe button for each feed", () => {
    render(<Feeds />);

    expect(screen.getByTestId(`unsubscribe-${FEED_A_ID}`)).toBeInTheDocument();
  });

  it("prompts with window.confirm and calls removeSubscription when confirmed", async () => {
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(true);

    render(<Feeds />);

    const unsubscribeButton = screen.getByTestId(`unsubscribe-${FEED_A_ID}`);
    fireEvent.click(unsubscribeButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      "You will no longer receive new articles from this feed."
    );
    await vi.waitFor(() => {
      expect(mockRemoveSubscription).toHaveBeenCalledWith({
        feedId: FEED_A_ID
      });
    });
    await vi.waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["subscriptions"]
      });
    });
  });

  it("invalidates the allArticles query after a successful unsubscribe", async () => {
    vi.spyOn(globalThis, "confirm").mockReturnValue(true);

    render(<Feeds />);

    const unsubscribeButton = screen.getByTestId(`unsubscribe-${FEED_A_ID}`);
    fireEvent.click(unsubscribeButton);

    await vi.waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["allArticles"]
      });
    });
  });

  it("invalidates the feedArticles query for the unsubscribed feed after a successful unsubscribe", async () => {
    vi.spyOn(globalThis, "confirm").mockReturnValue(true);

    render(<Feeds />);

    const unsubscribeButton = screen.getByTestId(`unsubscribe-${FEED_A_ID}`);
    fireEvent.click(unsubscribeButton);

    await vi.waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["feedArticles", FEED_A_ID]
      });
    });
  });

  it("clears selectedFeedId when the unsubscribed feed is the selected one", async () => {
    vi.spyOn(globalThis, "confirm").mockReturnValue(true);
    mockFeedsStore.selectedFeedId = FEED_A_ID;

    render(<Feeds />);

    const unsubscribeButton = screen.getByTestId(`unsubscribe-${FEED_A_ID}`);
    fireEvent.click(unsubscribeButton);

    await vi.waitFor(() => {
      expect(rssStore.setSelectedFeedId).toHaveBeenCalledWith(null);
    });
  });

  it("does NOT clear selectedFeedId when the unsubscribed feed is not selected", async () => {
    vi.spyOn(globalThis, "confirm").mockReturnValue(true);
    mockFeedsStore.selectedFeedId = FEED_B_ID;

    render(<Feeds />);

    const unsubscribeButton = screen.getByTestId(`unsubscribe-${FEED_A_ID}`);
    fireEvent.click(unsubscribeButton);

    await vi.waitFor(() => {
      expect(mockRemoveSubscription).toHaveBeenCalled();
    });
    expect(rssStore.setSelectedFeedId).not.toHaveBeenCalledWith(null);
  });

  it("does NOT call removeSubscription when user cancels the confirm dialog", () => {
    vi.spyOn(globalThis, "confirm").mockReturnValue(false);

    render(<Feeds />);

    const unsubscribeButton = screen.getByTestId(`unsubscribe-${FEED_A_ID}`);
    fireEvent.click(unsubscribeButton);

    expect(mockRemoveSubscription).not.toHaveBeenCalled();
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });

  it("does NOT select the feed when the unsubscribe button is clicked", () => {
    vi.spyOn(globalThis, "confirm").mockReturnValue(false);

    render(<Feeds />);

    const unsubscribeButton = screen.getByTestId(`unsubscribe-${FEED_A_ID}`);
    fireEvent.click(unsubscribeButton);

    expect(rssStore.setSelectedFeedId).not.toHaveBeenCalledWith(FEED_A_ID);
  });
});

describe("Feeds - SourceIcon", () => {
  beforeEach(() => {
    mockFeedsStore.queryData = {
      pages: [
        {
          edges: [
            {
              node: {
                iconUrl: FEED_A_ICON_URL,
                id: FEED_A_ID,
                title: ALPHA_FEED_TITLE,
                website: FEED_A_WEBSITE
              }
            },
            {
              node: {
                iconUrl: FEED_B_ICON_URL,
                id: FEED_B_ID,
                title: BETA_FEED_TITLE,
                website: FEED_B_WEBSITE
              }
            }
          ],
          pageInfo: { endCursor: null, hasNextPage: false }
        }
      ]
    };
    mockFeedsStore.selectedFeedId = null;
  });

  it("renders a SourceIcon img for each feed that has an iconUrl", () => {
    const { container } = render(<Feeds />);

    const images = container.querySelectorAll<HTMLImageElement>("img");
    const sources = filter(images, (image) => {
      return "source-icon-image" === image.dataset["testid"];
    });
    expect(sources).toHaveLength(2);

    const sourcesByFeed = new Map(
      map(sources, (image) => {
        const wrapper = image.closest<HTMLElement>("[data-feed-id]");
        return [wrapper?.dataset["feedId"] ?? null, image.getAttribute("src")];
      })
    );
    expect(sourcesByFeed.get(FEED_A_ID)).toBe(FEED_A_ICON_URL);
    expect(sourcesByFeed.get(FEED_B_ID)).toBe(FEED_B_ICON_URL);
  });

  it("renders the feed name button, SourceIcon, and unsubscribe button in each row", () => {
    const { container } = render(<Feeds />);

    expect(
      screen.getByRole("button", { name: ALPHA_FEED_TITLE })
    ).toBeInTheDocument();
    expect(screen.getByTestId(`unsubscribe-${FEED_A_ID}`)).toBeInTheDocument();

    const feedARow = container.querySelector(
      `[data-testid="feed-row-${CSS.escape(FEED_A_ID)}"]`
    );
    if (!feedARow) {
      throw new Error("expected feed row container to be present");
    }

    const feedAButton = screen.getByRole("button", {
      name: ALPHA_FEED_TITLE
    });
    const unsubscribeAButton = screen.getByTestId(`unsubscribe-${FEED_A_ID}`);
    const iconA = feedARow.querySelector("img");

    if (!iconA) {
      throw new Error("expected source icon img to be present in feed row");
    }

    expect(feedARow.contains(feedAButton)).toBe(true);
    expect(feedARow.contains(iconA)).toBe(true);
    expect(feedARow.contains(unsubscribeAButton)).toBe(true);
  });

  it("falls back to Newspaper when a feed has no iconUrl", () => {
    mockFeedsStore.queryData = {
      pages: [
        {
          edges: [
            {
              node: {
                iconUrl: null,
                id: FEED_A_ID,
                title: ALPHA_FEED_TITLE,
                website: FEED_A_WEBSITE
              }
            }
          ],
          pageInfo: { endCursor: null, hasNextPage: false }
        }
      ]
    };

    const { container } = render(<Feeds />);
    const images = container.querySelectorAll(
      '[data-testid="source-icon-image"]'
    );
    expect(images).toHaveLength(0);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
