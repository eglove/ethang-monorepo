import { describe, expect, it, vi } from "vitest";

import { createResolvers } from "./resolvers.ts";

const mockArticle = { feedId: "feed-1", id: "article-1", title: "Article 1" };
const mockFeed = { id: "feed-1", title: "Feed 1" };
const mockState = { articleId: "article-1", isRead: true };

const mockDatabase = {};

describe("resolvers", () => {
  const resolvers = createResolvers(mockDatabase as any);

  describe("Article", () => {
    it("should resolve reference using articleLoader", async () => {
      const mockContext = {
        articleLoader: {
          load: vi.fn().mockResolvedValue(mockArticle)
        }
      };

      const result = await resolvers.Article.__resolveReference(
        { id: "article-1" },
        mockContext as any
      );

      expect(result).toBe(mockArticle);
      expect(mockContext.articleLoader.load).toHaveBeenCalledWith("article-1");
    });

    it("should resolve isRead using userArticleStateLoader", async () => {
      const mockContext = {
        userArticleStateLoader: {
          load: vi.fn().mockResolvedValue(mockState)
        }
      };

      const isResult = await resolvers.Article.isRead(
        { id: "article-1" },
        undefined,
        mockContext as any
      );

      expect(isResult).toBe(true);
      expect(mockContext.userArticleStateLoader.load).toHaveBeenCalledWith(
        "article-1"
      );
    });

    it("should fallback to false for isRead if state is null", async () => {
      const mockContext = {
        userArticleStateLoader: {
          load: vi.fn().mockResolvedValue(null)
        }
      };

      const isResult = await resolvers.Article.isRead(
        { id: "article-1" },
        undefined,
        mockContext as any
      );

      expect(isResult).toBe(false);
    });

    it("should resolve feed using feedLoader", async () => {
      const mockContext = {
        feedLoader: {
          load: vi.fn().mockResolvedValue(mockFeed)
        }
      };

      const result = await resolvers.Article.feed(
        { feedId: "feed-1" },
        undefined,
        mockContext as any
      );

      expect(result).toBe(mockFeed);
      expect(mockContext.feedLoader.load).toHaveBeenCalledWith("feed-1");
    });
  });

  describe("Feed", () => {
    it("should resolve reference using feedLoader", async () => {
      const mockContext = {
        feedLoader: {
          load: vi.fn().mockResolvedValue(mockFeed)
        }
      };

      const result = await resolvers.Feed.__resolveReference(
        { id: "feed-1" },
        mockContext as any
      );

      expect(result).toBe(mockFeed);
      expect(mockContext.feedLoader.load).toHaveBeenCalledWith("feed-1");
    });

    it("should resolve articles using feedArticlesQuery", async () => {
      const localMockDatabase = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([mockArticle]),
          orderBy: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis()
        })
      };

      const resolversWithDatabase = createResolvers(localMockDatabase as any);

      const mockContext = {
        user: { sub: "user-123" }
      };

      const result = await resolversWithDatabase.Feed.articles(
        { id: "feed-1" },
        { first: 1 },
        mockContext as any
      );

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]?.node).toEqual({
        __typename: "Article",
        ...mockArticle
      });
    });
  });

  describe("Query and Mutation mappings", () => {
    it("should expose Query and Mutation resolvers", () => {
      expect(resolvers.Query.allArticles).toBeDefined();
      expect(resolvers.Query.feedArticles).toBeDefined();
      expect(resolvers.Query.subscription).toBeDefined();
      expect(resolvers.Query.subscriptions).toBeDefined();
      expect(resolvers.Mutation.addSubscription).toBeDefined();
      expect(resolvers.Mutation.markArticleRead).toBeDefined();
    });
  });
});
