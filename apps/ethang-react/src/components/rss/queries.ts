import { infiniteQueryOptions } from "@tanstack/react-query";
import isNil from "lodash/isNil";

import { rpcRequest } from "../../clients/rpc-client.ts";

const RSS_SERVICE = "ethang_rss";

export const subscriptionsOptions = () => {
  return infiniteQueryOptions({
    queryFn: async ({ pageParam }) => {
      return rpcRequest<{
        edges: { cursor: string; node: { id: string; title: string } }[];
        pageInfo: { endCursor: null | string; hasNextPage: boolean };
      }>(RSS_SERVICE, "subscriptions", {
        after: pageParam,
        first: 10,
        sortBy: { direction: "ASC", field: "TITLE" }
      });
    },
    // query sorting
    getNextPageParam: (lastPage) => {
      return lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : null;
    },
    initialPageParam: null as null | string,
    queryKey: ["subscriptions"]
  });
};

export const allArticlesOptions = () => {
  return infiniteQueryOptions({
    queryFn: async ({ pageParam }) => {
      return rpcRequest<{
        edges: {
          cursor: string;
          node: {
            feed: { id: string; title: string };
            id: string;
            isRead: boolean;
            link: string;
            publishedAt: null | string;
            title: string;
          };
        }[];
        pageInfo: { endCursor: null | string; hasNextPage: boolean };
      }>(RSS_SERVICE, "allArticles", {
        after: pageParam,
        isRead: false
      });
    },
    // query sorting
    getNextPageParam: (lastPage) => {
      return lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : null;
    },
    initialPageParam: null as null | string,
    queryKey: ["allArticles"]
  });
};

export const feedArticlesOptions = (feedId: null | string) => {
  return infiniteQueryOptions({
    enabled: !isNil(feedId),
    queryFn: async ({ pageParam }) => {
      return rpcRequest<{
        edges: {
          cursor: string;
          node: {
            feed: { id: string; title: string };
            id: string;
            isRead: boolean;
            link: string;
            publishedAt: null | string;
            title: string;
          };
        }[];
        pageInfo: { endCursor: null | string; hasNextPage: boolean };
      }>(RSS_SERVICE, "feedArticles", {
        after: pageParam,
        feedId: feedId ?? "",
        first: 20
      });
    },
    // query sorting
    getNextPageParam: (lastPage) => {
      return lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : null;
    },
    initialPageParam: null as null | string,
    queryKey: ["feedArticles", feedId]
  });
};
