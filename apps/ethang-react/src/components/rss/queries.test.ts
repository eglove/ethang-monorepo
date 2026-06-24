import { describe, expect, it, vi } from "vitest";

import { rpcRequest } from "../../clients/rpc-client.ts";
import {
  allArticlesOptions,
  feedArticlesOptions,
  subscriptionsOptions
} from "./queries.ts";

vi.mock("../../clients/rpc-client.ts", () => {
  return {
    rpcRequest: vi.fn()
  };
});

const cursor123 = "cursor-123";
const cursor456 = "cursor-456";
const cursorAbc = "cursor-abc";
const cursorXyz = "cursor-xyz";
const cursor789 = "cursor-789";
const callsRpcInQueryFunction = "calls rpcRequest in queryFn";
const returnsCorrectPageParameters =
  "returns correct page params when hasNextPage is true";
const returnsNullWhenHasNextPageIsFalse =
  "returns null when hasNextPage is false";

const makePageInfo = (endCursor: string, hasNextPage: boolean) => {
  return {
    pageInfo: { endCursor, hasNextPage }
  };
};

describe("RSS Queries Options", () => {
  describe("subscriptionsOptions", () => {
    it(returnsCorrectPageParameters, () => {
      const options = subscriptionsOptions();
      const lastPage = makePageInfo(cursor123, true);

      // @ts-expect-error for test
      const nextParameter = options.getNextPageParam(lastPage, [], null);
      expect(nextParameter).toBe(cursor123);
    });

    it(returnsNullWhenHasNextPageIsFalse, () => {
      const options = subscriptionsOptions();
      const lastPage = makePageInfo(cursor123, false);

      // @ts-expect-error for test
      const nextParameter = options.getNextPageParam(lastPage, [], null);
      expect(nextParameter).toBeNull();
    });

    it(callsRpcInQueryFunction, async () => {
      const mockResult = makePageInfo("", false);
      vi.mocked(rpcRequest).mockResolvedValue(mockResult);

      const options = subscriptionsOptions();
      // @ts-expect-error for test
      const result = await options.queryFn({
        meta: undefined,
        pageParam: cursorAbc,
        queryKey: ["subscriptions"]
      });

      expect(rpcRequest).toHaveBeenCalledWith("ethang_rss", "subscriptions", {
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
      const lastPage = makePageInfo(cursor456, true);

      // @ts-expect-error for test
      const nextParameter = options.getNextPageParam(lastPage, [], null);
      expect(nextParameter).toBe(cursor456);
    });

    it(returnsNullWhenHasNextPageIsFalse, () => {
      const options = feedArticlesOptions("feed-1");
      const lastPage = makePageInfo(cursor456, false);

      // @ts-expect-error for test
      const nextParameter = options.getNextPageParam(lastPage, [], null);
      expect(nextParameter).toBeNull();
    });

    it(callsRpcInQueryFunction, async () => {
      const mockResult = makePageInfo("", false);
      vi.mocked(rpcRequest).mockResolvedValue(mockResult);

      const options = feedArticlesOptions("feed-123");
      // @ts-expect-error for test
      const result = await options.queryFn({
        meta: undefined,
        pageParam: cursorXyz,
        queryKey: ["feedArticles", "feed-123"]
      });

      expect(rpcRequest).toHaveBeenCalledWith("ethang_rss", "feedArticles", {
        after: cursorXyz,
        feedId: "feed-123",
        first: 20
      });
      expect(result).toEqual(mockResult);
    });

    it("uses empty string for feedId if null is passed", async () => {
      const mockResult = makePageInfo("", false);
      vi.mocked(rpcRequest).mockResolvedValue(mockResult);

      const options = feedArticlesOptions(null);
      // @ts-expect-error for test
      const result = await options.queryFn({
        meta: undefined,
        pageParam: null,
        queryKey: ["feedArticles", null]
      });

      expect(rpcRequest).toHaveBeenCalledWith("ethang_rss", "feedArticles", {
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
      const lastPage = makePageInfo(cursor789, true);

      // @ts-expect-error for test
      const nextParameter = options.getNextPageParam(lastPage, [], null);
      expect(nextParameter).toBe(cursor789);
    });

    it(returnsNullWhenHasNextPageIsFalse, () => {
      const options = allArticlesOptions();
      const lastPage = makePageInfo(cursor789, false);

      // @ts-expect-error for test
      const nextParameter = options.getNextPageParam(lastPage, [], null);
      expect(nextParameter).toBeNull();
    });

    it(callsRpcInQueryFunction, async () => {
      const mockResult = makePageInfo("", false);
      vi.mocked(rpcRequest).mockResolvedValue(mockResult);

      const options = allArticlesOptions();
      // @ts-expect-error for test
      const result = await options.queryFn({
        meta: undefined,
        pageParam: cursorXyz,
        queryKey: ["allArticles"]
      });

      expect(rpcRequest).toHaveBeenCalledWith("ethang_rss", "allArticles", {
        after: cursorXyz,
        isRead: false
      });
      expect(result).toEqual(mockResult);
    });
  });
});
