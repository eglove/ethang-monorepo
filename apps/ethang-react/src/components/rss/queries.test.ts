import { describe, expect, it, vi } from "vitest";

import { graphqlRequest } from "../../clients/graphql-client.ts";
import {
  allArticlesOptions,
  feedArticlesOptions,
  subscriptionsOptions
} from "./queries.ts";

vi.mock("../../clients/graphql-client.ts", () => {
  return {
    graphqlRequest: vi.fn()
  };
});

const cursor123 = "cursor-123";
const cursor456 = "cursor-456";
const callsGraphqlRequestInQueryFunction = "calls graphqlRequest in queryFn";

describe("RSS Queries Options", () => {
  describe("subscriptionsOptions", () => {
    it("returns correct page params when hasNextPage is true", () => {
      const options = subscriptionsOptions();
      const lastPage = {
        subscriptions: {
          pageInfo: {
            endCursor: cursor123,
            hasNextPage: true
          }
        }
      };

      // @ts-expect-error for test
      const nextParameter = options.getNextPageParam(lastPage, [], null);
      expect(nextParameter).toBe(cursor123);
    });

    it("returns null when hasNextPage is false", () => {
      const options = subscriptionsOptions();
      const lastPage = {
        subscriptions: {
          pageInfo: {
            endCursor: cursor123,
            hasNextPage: false
          }
        }
      };

      // @ts-expect-error for test
      const nextParameter = options.getNextPageParam(lastPage, [], null);
      expect(nextParameter).toBeNull();
    });

    it(callsGraphqlRequestInQueryFunction, async () => {
      const mockResult = {
        subscriptions: { pageInfo: { endCursor: "", hasNextPage: false } }
      };
      vi.mocked(graphqlRequest).mockResolvedValue(mockResult);

      const options = subscriptionsOptions();
      // @ts-expect-error for test
      const result = await options.queryFn({
        meta: undefined,
        pageParam: "cursor-abc",
        queryKey: ["subscriptions"]
      });

      expect(graphqlRequest).toHaveBeenCalledWith(expect.any(Object), {
        after: "cursor-abc",
        first: 10,
        sortBy: { direction: "ASC", field: "TITLE" }
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe("feedArticlesOptions", () => {
    it("returns correct page params when hasNextPage is true", () => {
      const options = feedArticlesOptions("feed-1");
      const lastPage = {
        feedArticles: {
          pageInfo: {
            endCursor: cursor456,
            hasNextPage: true
          }
        }
      };

      // @ts-expect-error for test
      const nextParameter = options.getNextPageParam(lastPage, [], null);
      expect(nextParameter).toBe(cursor456);
    });

    it("returns null when hasNextPage is false", () => {
      const options = feedArticlesOptions("feed-1");
      const lastPage = {
        feedArticles: {
          pageInfo: {
            endCursor: cursor456,
            hasNextPage: false
          }
        }
      };

      // @ts-expect-error for test
      const nextParameter = options.getNextPageParam(lastPage, [], null);
      expect(nextParameter).toBeNull();
    });

    it(callsGraphqlRequestInQueryFunction, async () => {
      const mockResult = {
        feedArticles: { pageInfo: { endCursor: "", hasNextPage: false } }
      };
      vi.mocked(graphqlRequest).mockResolvedValue(mockResult);

      const options = feedArticlesOptions("feed-123");
      // @ts-expect-error for test
      const result = await options.queryFn({
        meta: undefined,
        pageParam: "cursor-xyz",
        queryKey: ["feedArticles", "feed-123"]
      });

      expect(graphqlRequest).toHaveBeenCalledWith(expect.any(Object), {
        after: "cursor-xyz",
        feedId: "feed-123",
        first: 20
      });
      expect(result).toEqual(mockResult);
    });

    it("uses empty string for feedId if null is passed", async () => {
      const mockResult = {
        feedArticles: { pageInfo: { endCursor: "", hasNextPage: false } }
      };
      vi.mocked(graphqlRequest).mockResolvedValue(mockResult);

      const options = feedArticlesOptions(null);
      // @ts-expect-error for test
      const result = await options.queryFn({
        meta: undefined,
        pageParam: null,
        queryKey: ["feedArticles", null]
      });

      expect(graphqlRequest).toHaveBeenCalledWith(expect.any(Object), {
        after: null,
        feedId: "",
        first: 20
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe("allArticlesOptions", () => {
    it(callsGraphqlRequestInQueryFunction, async () => {
      const mockResult = { allArticles: [] };
      vi.mocked(graphqlRequest).mockResolvedValue(mockResult);

      const options = allArticlesOptions();
      // @ts-expect-error for test
      const result = await options.queryFn();

      expect(graphqlRequest).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual(mockResult);
    });
  });
});
