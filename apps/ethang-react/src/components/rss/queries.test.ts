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
const cursorAbc = "cursor-abc";
const cursorXyz = "cursor-xyz";
const cursor789 = "cursor-789";
const callsGraphqlRequestInQueryFunction = "calls graphqlRequest in queryFn";
const returnsCorrectPageParameters =
  "returns correct page params when hasNextPage is true";
const returnsNullWhenHasNextPageIsFalse =
  "returns null when hasNextPage is false";

describe("RSS Queries Options", () => {
  describe("subscriptionsOptions", () => {
    it(returnsCorrectPageParameters, () => {
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

    it(returnsNullWhenHasNextPageIsFalse, () => {
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
        pageParam: cursorAbc,
        queryKey: ["subscriptions"]
      });

      expect(graphqlRequest).toHaveBeenCalledWith(expect.any(Object), {
        after: cursorAbc,
        first: 10,
        sortBy: { direction: "ASC", field: "TITLE" }
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe("feedArticlesOptions", () => {
    it(returnsCorrectPageParameters, () => {
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

    it(returnsNullWhenHasNextPageIsFalse, () => {
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
        pageParam: cursorXyz,
        queryKey: ["feedArticles", "feed-123"]
      });

      expect(graphqlRequest).toHaveBeenCalledWith(expect.any(Object), {
        after: cursorXyz,
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
    it(returnsCorrectPageParameters, () => {
      const options = allArticlesOptions();
      const lastPage = {
        allArticles: {
          pageInfo: {
            endCursor: cursor789,
            hasNextPage: true
          }
        }
      };

      // @ts-expect-error for test
      const nextParameter = options.getNextPageParam(lastPage, [], null);
      expect(nextParameter).toBe(cursor789);
    });

    it(returnsNullWhenHasNextPageIsFalse, () => {
      const options = allArticlesOptions();
      const lastPage = {
        allArticles: {
          pageInfo: {
            endCursor: cursor789,
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
        allArticles: { pageInfo: { endCursor: "", hasNextPage: false } }
      };
      vi.mocked(graphqlRequest).mockResolvedValue(mockResult);

      const options = allArticlesOptions();
      // @ts-expect-error for test
      const result = await options.queryFn({
        meta: undefined,
        pageParam: cursorXyz,
        queryKey: ["allArticles"]
      });

      expect(graphqlRequest).toHaveBeenCalledWith(expect.any(Object), {
        after: cursorXyz,
        isRead: false
      });
      expect(result).toEqual(mockResult);
    });
  });
});
