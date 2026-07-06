import { infiniteQueryOptions } from "@tanstack/react-query";
import isNil from "lodash/isNil";

import { rpcRequest } from "../../clients/rpc-client.ts";

const RSS_SERVICE = "ethang_rss";

type ArticleFeed = {
  iconUrl: null | string;
  id: string;
  title: string;
};

type ArticleNode = {
  feed: ArticleFeed;
  id: string;
  isRead: boolean;
  link: string;
  publishedAt: null | string;
  title: string;
};

type SubscriptionNode = {
  iconUrl: null | string;
  id: string;
  title: string;
  website: null | string;
};

export const subscriptionsOptions = () => {
  return infiniteQueryOptions({
    queryFn: async ({ pageParam }) => {
      return rpcRequest<{
        edges: { cursor: string; node: SubscriptionNode }[];
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
        edges: { cursor: string; node: ArticleNode }[];
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
        edges: { cursor: string; node: ArticleNode }[];
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

export const removeSubscriptionMutationFunction = async (variables: {
  feedId: string;
}) => {
  return rpcRequest(RSS_SERVICE, "removeSubscription", variables);
};
