import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Articles } from "./articles.tsx";

let mockAllArticlesData: unknown = null;
let mockFeedArticlesData: unknown = null;
let mockSelectedFeedId: null | string = null;
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
        if (null !== mockAllArticlesData) {
          const { pages } = mockAllArticlesData as {
            pages: { allArticles: { pageInfo: { hasNextPage: boolean } } }[];
          };
          hasNextPage = pages[0]?.allArticles.pageInfo.hasNextPage ?? false;
        }
      } else if (null === mockFeedArticlesData) {
        // do nothing
      } else {
        const { pages } = mockFeedArticlesData as {
          pages: { feedArticles: { pageInfo: { hasNextPage: boolean } } }[];
        };
        hasNextPage = pages[0]?.feedArticles.pageInfo.hasNextPage ?? false;
      }

      const data = isAll ? mockAllArticlesData : mockFeedArticlesData;

      return {
        data,
        fetchNextPage: isAll ? mockFetchNextPageAll : mockFetchNextPageFeed,
        hasNextPage,
        isFetchingNextPage: false,
        isPending: false
      };
    },
    useMutation: () => {
      return { isPending: false, mutateAsync: mockMutate };
    },
    useQuery: () => {
      return { data: mockAllArticlesData, isPending: false };
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
      return selector({ selectedFeedId: mockSelectedFeedId });
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
const CURSOR_ONE = "cursor-1";
const CURSOR_TWO = "cursor-2";
const FEED_ONE = "feed-1";
const LOAD_MORE_BUTTON_NAME = "Load More";

const clearMocks = () => {
  mockAllArticlesData = null;
  mockFeedArticlesData = null;
  mockSelectedFeedId = null;
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
    mockSelectedFeedId = null;
    mockAllArticlesData = {
      pages: [
        {
          allArticles: {
            edges: [
              {
                node: {
                  feed: { id: "feed-1", title: "Test Feed" },
                  id: ARTICLE_ONE_ID,
                  isRead: false,
                  link: ARTICLE_ONE_LINK,
                  publishedAt: ARTICLE_ONE_DATE,
                  title: ARTICLE_ONE_TITLE
                }
              }
            ],
            pageInfo: {
              endCursor: CURSOR_ONE,
              hasNextPage: false
            }
          }
        }
      ]
    };

    render(<Articles />);

    expect(screen.getByText(ARTICLE_ONE_TITLE)).toBeDefined();
    expect(
      screen.queryByRole("button", { name: LOAD_MORE_BUTTON_NAME })
    ).toBeNull();
  });

  it("renders feed articles when selectedFeedId is set", () => {
    mockSelectedFeedId = FEED_ONE;
    mockFeedArticlesData = {
      pages: [
        {
          feedArticles: {
            edges: [
              {
                node: {
                  feed: { id: FEED_ONE, title: "Test Feed" },
                  id: ARTICLE_TWO_ID,
                  isRead: false,
                  link: ARTICLE_TWO_LINK,
                  publishedAt: ARTICLE_TWO_DATE,
                  title: ARTICLE_TWO_TITLE
                }
              }
            ],
            pageInfo: {
              endCursor: CURSOR_TWO,
              hasNextPage: false
            }
          }
        }
      ]
    };

    render(<Articles />);

    expect(screen.getByText(ARTICLE_TWO_TITLE)).toBeDefined();
    expect(
      screen.queryByRole("button", { name: LOAD_MORE_BUTTON_NAME })
    ).toBeNull();
  });

  it("calls markArticleRead mutation when Mark as Read is clicked", () => {
    mockSelectedFeedId = FEED_ONE;
    mockFeedArticlesData = {
      pages: [
        {
          feedArticles: {
            edges: [
              {
                node: {
                  feed: { id: FEED_ONE, title: "Test Feed" },
                  id: ARTICLE_TWO_ID,
                  isRead: false,
                  link: ARTICLE_TWO_LINK,
                  publishedAt: ARTICLE_TWO_DATE,
                  title: ARTICLE_TWO_TITLE
                }
              }
            ],
            pageInfo: {
              endCursor: CURSOR_TWO,
              hasNextPage: false
            }
          }
        }
      ]
    };

    render(<Articles />);

    const markReadButton = screen.getByRole("button", { name: "Mark as Read" });
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
    mockSelectedFeedId = FEED_ONE;
    mockFeedArticlesData = {
      pages: [
        {
          feedArticles: {
            edges: [
              {
                node: {
                  feed: { id: FEED_ONE, title: "Test Feed" },
                  id: ARTICLE_TWO_ID,
                  isRead: false,
                  link: ARTICLE_TWO_LINK,
                  publishedAt: ARTICLE_TWO_DATE,
                  title: ARTICLE_TWO_TITLE
                }
              }
            ],
            pageInfo: {
              endCursor: CURSOR_TWO,
              hasNextPage: true
            }
          }
        }
      ]
    };

    render(<Articles />);

    expect(
      screen.getByRole("button", { name: LOAD_MORE_BUTTON_NAME })
    ).toBeDefined();
  });

  it("calls fetchMore when Load More is clicked on specific feed", () => {
    mockSelectedFeedId = FEED_ONE;
    mockFeedArticlesData = {
      pages: [
        {
          feedArticles: {
            edges: [
              {
                node: {
                  feed: { id: FEED_ONE, title: "Test Feed" },
                  id: ARTICLE_TWO_ID,
                  isRead: false,
                  link: ARTICLE_TWO_LINK,
                  publishedAt: ARTICLE_TWO_DATE,
                  title: ARTICLE_TWO_TITLE
                }
              }
            ],
            pageInfo: {
              endCursor: CURSOR_TWO,
              hasNextPage: true
            }
          }
        }
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
    mockSelectedFeedId = null;
    mockAllArticlesData = {
      pages: [
        {
          allArticles: {
            edges: [
              {
                node: {
                  feed: { id: "feed-1", title: "Test Feed" },
                  id: ARTICLE_ONE_ID,
                  isRead: false,
                  link: ARTICLE_ONE_LINK,
                  publishedAt: ARTICLE_ONE_DATE,
                  title: ARTICLE_ONE_TITLE
                }
              }
            ],
            pageInfo: {
              endCursor: CURSOR_ONE,
              hasNextPage: true
            }
          }
        }
      ]
    };

    render(<Articles />);

    expect(
      screen.getByRole("button", { name: LOAD_MORE_BUTTON_NAME })
    ).toBeDefined();
  });

  it("calls fetchMore when Load More is clicked on all articles feed", () => {
    mockSelectedFeedId = null;
    mockAllArticlesData = {
      pages: [
        {
          allArticles: {
            edges: [
              {
                node: {
                  feed: { id: "feed-1", title: "Test Feed" },
                  id: ARTICLE_ONE_ID,
                  isRead: false,
                  link: ARTICLE_ONE_LINK,
                  publishedAt: ARTICLE_ONE_DATE,
                  title: ARTICLE_ONE_TITLE
                }
              }
            ],
            pageInfo: {
              endCursor: CURSOR_ONE,
              hasNextPage: true
            }
          }
        }
      ]
    };

    render(<Articles />);

    const loadMoreButton = screen.getByRole("button", {
      name: LOAD_MORE_BUTTON_NAME
    });
    fireEvent.click(loadMoreButton);

    expect(mockFetchNextPageAll).toHaveBeenCalled();
  });
});
