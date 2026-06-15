import { gql } from "@ethang/graphql-types/__generated__";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import isNil from "lodash/isNil";

import { graphqlRequest } from "../../clients/graphql-client.ts";

export const subscriptionsOptions = () => {
  return infiniteQueryOptions({
    queryFn: async ({ pageParam }) => {
      return graphqlRequest(
        gql(`query Subscriptions($first: Int, $after: String, $sortBy: SubscriptionSortInput) {
            subscriptions(first: $first, after: $after, sortBy: $sortBy) {
                pageInfo {
                    hasNextPage
                    endCursor
                }
                edges {
                    node {
                        id
                        title
                    }
                }
            }
        }`),
        {
          after: pageParam,
          first: 10,
          sortBy: { direction: "ASC", field: "TITLE" }
        }
      );
    },
    // query order
    getNextPageParam: (lastPage) => {
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
    queryFn: async ({ pageParam }) => {
      return graphqlRequest(
        gql(`query FeedArticles($feedId: String!, $after: String, $first: Int) {
            feedArticles(feedId: $feedId, after: $after, first: $first) {
                pageInfo {
                    hasNextPage
                    endCursor
                }
                edges {
                    node {
                        id
                        isRead
                        title
                        link
                        publishedAt
                    }
                }
            }
        }`),
        {
          after: pageParam,
          feedId: feedId ?? "",
          first: 20
        }
      );
    },
    // query order
    getNextPageParam: (lastPage) => {
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
    queryFn: async () => {
      return graphqlRequest(
        gql(`query AllArticles {
            subscriptions {
                edges {
                    node {
                        id
                        title
                        articles {
                            edges {
                                node {
                                    id
                                    isRead
                                    title
                                    link
                                    publishedAt
                                }
                            }
                        }
                    }
                }
            }
        }`)
      );
    },
    queryKey: ["allArticles"]
  });
};
