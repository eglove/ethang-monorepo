import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { Articles } from "./articles.tsx";

const mockArticlesStore = {
  allArticlesData: null as unknown,
  allArticlesPending: false,
  feedArticlesData: null as unknown,
  feedArticlesPending: false,
  isMutationPending: false,
  selectedFeedId: null as null | string
};
const mockFetchNextPageAll = vi.fn().mockResolvedValue({});
const mockFetchNextPageFeed = vi.fn().mockResolvedValue({});
const mockMutate = vi.fn().mockResolvedValue({});
const mockInvalidateQueries = vi.fn().mockResolvedValue({});

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // @ts-expect-error for test
    ...actual,
    useInfiniteQuery: (options: any) => {
      const isAll = "allArticles" === options?.queryKey?.[0];
      let hasNextPage = false;

      if (isAll) {
        if (null !== mockArticlesStore.allArticlesData) {
          const { pages } = mockArticlesStore.allArticlesData as {
            pages: { pageInfo: { hasNextPage: boolean } }[];
          };
          hasNextPage = pages[0]?.pageInfo.hasNextPage ?? false;
        }
      } else if (null === mockArticlesStore.feedArticlesData) {
        // do nothing
      } else {
        const { pages } = mockArticlesStore.feedArticlesData as {
          pages: { pageInfo: { hasNextPage: boolean } }[];
        };
        hasNextPage = pages[0]?.pageInfo.hasNextPage ?? false;
      }

      const data = isAll
        ? mockArticlesStore.allArticlesData
        : mockArticlesStore.feedArticlesData;

      const isPending = isAll
        ? mockArticlesStore.allArticlesPending
        : mockArticlesStore.feedArticlesPending;

      return {
        data,
        fetchNextPage: isAll ? mockFetchNextPageAll : mockFetchNextPageFeed,
        hasNextPage,
        isFetchingNextPage: false,
        isLoading: isPending,
        isPending
      };
    },
    useMutation: () => {
      return {
        isPending: mockArticlesStore.isMutationPending,
        mutateAsync: mockMutate
      };
    },
    useQuery: () => {
      return { data: mockArticlesStore.allArticlesData, isPending: false };
    },
    useQueryClient: () => {
      return {
        invalidateQueries: mockInvalidateQueries
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
      return selector({ selectedFeedId: mockArticlesStore.selectedFeedId });
    }
  };
});

const ARTICLE_TWO_ID = "article-2";
const ARTICLE_TWO_LINK = "https://example.com/2";
const ARTICLE_TWO_DATE = "2026-06-15T21:00:00.000Z";
const ARTICLE_TWO_TITLE = "Article Two";
const ARTICLE_ONE_ID = "article-1";
const ARTICLE_ONE_LINK = "https://example.com/1";
const ARTICLE_ONE_DATE = "2026-06-15T20:00:00.000Z";
const ARTICLE_ONE_TITLE = "Article One";
const FEED_ONE = "feed-1";
const LOAD_MORE_BUTTON_NAME = "Load More";
const MARK_AS_READ = "Mark as Read";

const makePage = (edges: any[], hasNextPage: boolean) => {
  return {
    edges,
    pageInfo: { endCursor: "cursor", hasNextPage }
  };
};

const makeArticleEdge = (
  overrides: Partial<{
    feed: { id: string; title: string };
    id: string;
    isRead: boolean;
    link: string;
    publishedAt: string;
    title: string;
  }>
) => {
  return {
    cursor: "test-cursor",
    node: {
      feed: { id: FEED_ONE, title: "Test Feed" },
      id: ARTICLE_ONE_ID,
      isRead: false,
      link: ARTICLE_ONE_LINK,
      publishedAt: ARTICLE_ONE_DATE,
      title: ARTICLE_ONE_TITLE,
      ...overrides
    }
  };
};

const clearMocks = () => {
  mockArticlesStore.allArticlesData = null;
  mockArticlesStore.allArticlesPending = false;
  mockArticlesStore.feedArticlesData = null;
  mockArticlesStore.feedArticlesPending = false;
  mockArticlesStore.isMutationPending = false;
  mockArticlesStore.selectedFeedId = null;
  mockFetchNextPageAll.mockClear();
  mockFetchNextPageFeed.mockClear();
  mockMutate.mockClear();
  mockInvalidateQueries.mockClear();
};

describe("Articles - Rendering and Actions", () => {
  beforeEach(() => {
    clearMocks();
  });

  it("renders flat list of all articles when selectedFeedId is null", () => {
    mockArticlesStore.selectedFeedId = null;
    mockArticlesStore.allArticlesData = {
      pages: [
        makePage(
          [makeArticleEdge({ id: ARTICLE_ONE_ID, title: ARTICLE_ONE_TITLE })],
          false
        )
      ]
    };

    render(<Articles />);

    expect(screen.getByText(ARTICLE_ONE_TITLE)).toBeDefined();
    expect(
      screen.queryByRole("button", { name: LOAD_MORE_BUTTON_NAME })
    ).toBeNull();
  });

  it("renders feed articles when selectedFeedId is set", () => {
    mockArticlesStore.selectedFeedId = FEED_ONE;
    mockArticlesStore.feedArticlesData = {
      pages: [
        makePage(
          [
            makeArticleEdge({
              id: ARTICLE_TWO_ID,
              link: ARTICLE_TWO_LINK,
              publishedAt: ARTICLE_TWO_DATE,
              title: ARTICLE_TWO_TITLE
            })
          ],
          false
        )
      ]
    };

    render(<Articles />);

    expect(screen.getByText(ARTICLE_TWO_TITLE)).toBeDefined();
    expect(
      screen.queryByRole("button", { name: LOAD_MORE_BUTTON_NAME })
    ).toBeNull();
  });

  it("calls markArticleRead mutation when Mark as Read is clicked", () => {
    mockArticlesStore.selectedFeedId = FEED_ONE;
    mockArticlesStore.feedArticlesData = {
      pages: [
        makePage(
          [
            makeArticleEdge({
              id: ARTICLE_TWO_ID,
              link: ARTICLE_TWO_LINK,
              publishedAt: ARTICLE_TWO_DATE,
              title: ARTICLE_TWO_TITLE
            })
          ],
          false
        )
      ]
    };

    render(<Articles />);

    const markReadButton = screen.getByRole("button", { name: MARK_AS_READ });
    fireEvent.click(markReadButton);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        articleId: ARTICLE_TWO_ID,
        isRead: true
      })
    );
  });
});

describe("Articles - Pagination", () => {
  beforeEach(() => {
    clearMocks();
  });

  it("renders a Load More button when hasNextPage is true on specific feed", () => {
    mockArticlesStore.selectedFeedId = FEED_ONE;
    mockArticlesStore.feedArticlesData = {
      pages: [
        makePage(
          [
            makeArticleEdge({
              id: ARTICLE_TWO_ID,
              link: ARTICLE_TWO_LINK,
              publishedAt: ARTICLE_TWO_DATE,
              title: ARTICLE_TWO_TITLE
            })
          ],
          true
        )
      ]
    };

    render(<Articles />);

    expect(
      screen.getByRole("button", { name: LOAD_MORE_BUTTON_NAME })
    ).toBeDefined();
  });

  it("calls fetchMore when Load More is clicked on specific feed", () => {
    mockArticlesStore.selectedFeedId = FEED_ONE;
    mockArticlesStore.feedArticlesData = {
      pages: [
        makePage(
          [
            makeArticleEdge({
              id: ARTICLE_TWO_ID,
              link: ARTICLE_TWO_LINK,
              publishedAt: ARTICLE_TWO_DATE,
              title: ARTICLE_TWO_TITLE
            })
          ],
          true
        )
      ]
    };

    render(<Articles />);

    const loadMoreButton = screen.getByRole("button", {
      name: LOAD_MORE_BUTTON_NAME
    });
    fireEvent.click(loadMoreButton);

    expect(mockFetchNextPageFeed).toHaveBeenCalled();
  });

  it("renders a Load More button when hasNextPage is true on all articles feed", () => {
    mockArticlesStore.selectedFeedId = null;
    mockArticlesStore.allArticlesData = {
      pages: [
        makePage(
          [makeArticleEdge({ id: ARTICLE_ONE_ID, title: ARTICLE_ONE_TITLE })],
          true
        )
      ]
    };

    render(<Articles />);

    expect(
      screen.getByRole("button", { name: LOAD_MORE_BUTTON_NAME })
    ).toBeDefined();
  });

  it("calls fetchMore when Load More is clicked on all articles feed", () => {
    mockArticlesStore.selectedFeedId = null;
    mockArticlesStore.allArticlesData = {
      pages: [
        makePage(
          [makeArticleEdge({ id: ARTICLE_ONE_ID, title: ARTICLE_ONE_TITLE })],
          true
        )
      ]
    };

    render(<Articles />);

    const loadMoreButton = screen.getByRole("button", {
      name: LOAD_MORE_BUTTON_NAME
    });
    fireEvent.click(loadMoreButton);

    expect(mockFetchNextPageAll).toHaveBeenCalled();
  });

  it("disables Mark as Read button when allArticles query is pending", () => {
    mockArticlesStore.selectedFeedId = null;
    mockArticlesStore.allArticlesPending = true;
    mockArticlesStore.allArticlesData = {
      pages: [
        makePage(
          [makeArticleEdge({ id: ARTICLE_ONE_ID, title: ARTICLE_ONE_TITLE })],
          false
        )
      ]
    };

    render(<Articles />);

    const markAsReadButton = screen.getByRole("button", {
      name: MARK_AS_READ
    });
    expect(markAsReadButton).toBeDisabled();
  });

  it("disables Mark as Read button when feedArticles query is pending", () => {
    mockArticlesStore.selectedFeedId = FEED_ONE;
    mockArticlesStore.feedArticlesPending = true;
    mockArticlesStore.feedArticlesData = {
      pages: [
        makePage(
          [
            makeArticleEdge({
              id: ARTICLE_TWO_ID,
              link: ARTICLE_TWO_LINK,
              publishedAt: ARTICLE_TWO_DATE,
              title: ARTICLE_TWO_TITLE
            })
          ],
          false
        )
      ]
    };

    render(<Articles />);

    const markAsReadButton = screen.getByRole("button", {
      name: MARK_AS_READ
    });
    expect(markAsReadButton).toBeDisabled();
  });

  it("enables Mark as Read button when all queries resolved and mutation not pending", () => {
    mockArticlesStore.selectedFeedId = null;
    mockArticlesStore.allArticlesPending = false;
    mockArticlesStore.isMutationPending = false;
    mockArticlesStore.allArticlesData = {
      pages: [
        makePage(
          [makeArticleEdge({ id: ARTICLE_ONE_ID, title: ARTICLE_ONE_TITLE })],
          false
        )
      ]
    };

    render(<Articles />);

    const markAsReadButton = screen.getByRole("button", {
      name: MARK_AS_READ
    });
    expect(markAsReadButton).not.toBeDisabled();
  });
});
