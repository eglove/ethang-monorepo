import {
  AllArticlesDocument,
  type AllArticlesQuery,
  FeedArticlesDocument,
  type FeedArticlesQuery,
  GetFeedsDocument,
  type GetFeedsQuery
} from "@ethang/graphql-types/__generated__/graphql";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import isNil from "lodash/isNil";

import { graphqlRequest } from "../../clients/graphql-client.ts";

export const subscriptionsOptions = () => {
  return infiniteQueryOptions({
    queryFn: async ({ pageParam }): Promise<GetFeedsQuery> => {
      return graphqlRequest(GetFeedsDocument, {
        after: pageParam,
        first: 10,
        sortBy: { direction: "ASC", field: "TITLE" }
      });
    },
    // query order
    getNextPageParam: (lastPage: GetFeedsQuery) => {
      return lastPage.subscriptions.pageInfo.hasNextPage
        ? lastPage.subscriptions.pageInfo.endCursor
        : null;
    },
    initialPageParam: null as null | string,
    queryKey: ["subscriptions"]
  });
};

export const feedArticlesOptions = (feedId: null | string) => {
  return infiniteQueryOptions({
    enabled: !isNil(feedId),
    queryFn: async ({ pageParam }): Promise<FeedArticlesQuery> => {
      return graphqlRequest(FeedArticlesDocument, {
        after: pageParam,
        feedId: feedId ?? "",
        first: 20
      });
    },
    // query order
    getNextPageParam: (lastPage: FeedArticlesQuery) => {
      return lastPage.feedArticles.pageInfo.hasNextPage
        ? lastPage.feedArticles.pageInfo.endCursor
        : null;
    },
    initialPageParam: null as null | string,
    queryKey: ["feedArticles", feedId]
  });
};

export const allArticlesOptions = () => {
  return queryOptions({
    queryFn: async (): Promise<AllArticlesQuery> => {
      return graphqlRequest(AllArticlesDocument);
    },
    queryKey: ["allArticles"]
  });
};
