import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Articles } from "./articles.tsx";

let mockAllArticlesData: unknown = null;
let mockFeedArticlesData: unknown = null;
let mockSelectedFeedId: null | string = null;
const mockFetchNextPageFeed = vi.fn().mockResolvedValue({});
const mockMutate = vi.fn().mockResolvedValue({});
const mockInvalidateQueries = vi.fn().mockResolvedValue({});

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // @ts-expect-error for test
    ...actual,
    useInfiniteQuery: () => {
      let hasNextPage = false;
      if (null !== mockFeedArticlesData) {
        const { pages } = mockFeedArticlesData as {
          pages: { feedArticles: { pageInfo: { hasNextPage: boolean } } }[];
        };
        hasNextPage = pages[0]?.feedArticles.pageInfo.hasNextPage ?? false;
      }
      return {
        data: mockFeedArticlesData,
        fetchNextPage: mockFetchNextPageFeed,
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
const TEST_FEED_TITLE = "Test Feed";

describe("Articles", () => {
  beforeEach(() => {
    mockAllArticlesData = null;
    mockFeedArticlesData = null;
    mockSelectedFeedId = null;
    mockFetchNextPageFeed.mockClear();
    mockMutate.mockClear();
    mockInvalidateQueries.mockClear();
  });

  it("renders flat list of all articles when selectedFeedId is null", () => {
    mockSelectedFeedId = null;
    mockAllArticlesData = {
      subscriptions: {
        edges: [
          {
            node: {
              articles: {
                edges: [
                  {
                    node: {
                      id: "article-1",
                      isRead: false,
                      link: "https://example.com/1",
                      publishedAt: "2026-06-15T20:00:00.000Z",
                      title: "Article One"
                    }
                  }
                ]
              }
            }
          }
        ]
      }
    };

    render(<Articles feedTitle={TEST_FEED_TITLE} />);

    expect(screen.getByText("Article One")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Load More" })).toBeNull();
  });

  it("renders feed articles when selectedFeedId is set", () => {
    mockSelectedFeedId = "feed-1";
    mockFeedArticlesData = {
      pages: [
        {
          feedArticles: {
            edges: [
              {
                node: {
                  id: ARTICLE_TWO_ID,
                  isRead: false,
                  link: ARTICLE_TWO_LINK,
                  publishedAt: ARTICLE_TWO_DATE,
                  title: ARTICLE_TWO_TITLE
                }
              }
            ],
            pageInfo: {
              endCursor: "cursor-2",
              hasNextPage: false
            }
          }
        }
      ]
    };

    render(<Articles feedTitle={TEST_FEED_TITLE} />);

    expect(screen.getByText(ARTICLE_TWO_TITLE)).toBeDefined();
    expect(screen.queryByRole("button", { name: "Load More" })).toBeNull();
  });

  it("calls markArticleRead mutation when Mark as Read is clicked", () => {
    mockSelectedFeedId = "feed-1";
    mockFeedArticlesData = {
      pages: [
        {
          feedArticles: {
            edges: [
              {
                node: {
                  id: ARTICLE_TWO_ID,
                  isRead: false,
                  link: ARTICLE_TWO_LINK,
                  publishedAt: ARTICLE_TWO_DATE,
                  title: ARTICLE_TWO_TITLE
                }
              }
            ],
            pageInfo: {
              endCursor: "cursor-2",
              hasNextPage: false
            }
          }
        }
      ]
    };

    render(<Articles feedTitle={TEST_FEED_TITLE} />);

    const markReadButton = screen.getByRole("button", { name: "Mark as Read" });
    fireEvent.click(markReadButton);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        articleId: ARTICLE_TWO_ID,
        isRead: true
      })
    );
  });

  it("renders a Load More button when hasNextPage is true on specific feed", () => {
    mockSelectedFeedId = "feed-1";
    mockFeedArticlesData = {
      pages: [
        {
          feedArticles: {
            edges: [
              {
                node: {
                  id: ARTICLE_TWO_ID,
                  isRead: false,
                  link: ARTICLE_TWO_LINK,
                  publishedAt: ARTICLE_TWO_DATE,
                  title: ARTICLE_TWO_TITLE
                }
              }
            ],
            pageInfo: {
              endCursor: "cursor-2",
              hasNextPage: true
            }
          }
        }
      ]
    };

    render(<Articles feedTitle={TEST_FEED_TITLE} />);

    expect(screen.getByRole("button", { name: "Load More" })).toBeDefined();
  });

  it("calls fetchMore when Load More is clicked on specific feed", () => {
    mockSelectedFeedId = "feed-1";
    mockFeedArticlesData = {
      pages: [
        {
          feedArticles: {
            edges: [
              {
                node: {
                  id: ARTICLE_TWO_ID,
                  isRead: false,
                  link: ARTICLE_TWO_LINK,
                  publishedAt: ARTICLE_TWO_DATE,
                  title: ARTICLE_TWO_TITLE
                }
              }
            ],
            pageInfo: {
              endCursor: "cursor-2",
              hasNextPage: true
            }
          }
        }
      ]
    };

    render(<Articles feedTitle={TEST_FEED_TITLE} />);

    const loadMoreButton = screen.getByRole("button", { name: "Load More" });
    fireEvent.click(loadMoreButton);

    expect(mockFetchNextPageFeed).toHaveBeenCalled();
  });
});
