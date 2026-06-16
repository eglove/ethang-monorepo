import { gql } from "@ethang/graphql-types/__generated__";
import { useStore } from "@ethang/store/use-store";
import { Box, Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import isNil from "lodash/isNil";
import map from "lodash/map";
import noop from "lodash/noop";
import orderBy from "lodash/orderBy";
import { DateTime } from "luxon";

import { graphqlRequest } from "../../clients/graphql-client.ts";
import { allArticlesOptions, feedArticlesOptions } from "./queries.ts";
import { rssStore } from "./rss-store.ts";
import { decodeHtmlEntities } from "./utilities.ts";

type ArticlesProperties = {
  feedTitle: string;
};

export const Articles = ({ feedTitle }: Readonly<ArticlesProperties>) => {
  const feedId = useStore(rssStore, (state) => {
    return state.selectedFeedId;
  });

  const queryClient = useQueryClient();

  const {
    data: allData,
    fetchNextPage: fetchNextPageAll,
    hasNextPage: hasNextPageAll,
    isFetchingNextPage: isFetchingNextPageAll
  } = useInfiniteQuery(allArticlesOptions());

  const {
    data: feedData,
    fetchNextPage: fetchNextPageFeed,
    hasNextPage: hasNextPageFeed,
    isFetchingNextPage: isFetchingNextPageFeed
  } = useInfiniteQuery(feedArticlesOptions(feedId));

  const allEdges = isNil(allData)
    ? []
    : allData.pages.flatMap((page) => {
        return page.allArticles.edges;
      });

  const feedEdges = isNil(feedData)
    ? []
    : feedData.pages.flatMap((page) => {
        return page.feedArticles.edges;
      });

  const data = isNil(feedId) ? allEdges : feedEdges;

  const hasNextPage = isNil(feedId) ? hasNextPageAll : hasNextPageFeed;
  const isFetchingNextPage = isNil(feedId)
    ? isFetchingNextPageAll
    : isFetchingNextPageFeed;
  const fetchNextPage = isNil(feedId) ? fetchNextPageAll : fetchNextPageFeed;

  const { isPending: isMarkingRead, mutateAsync: markArticleRead } =
    useMutation({
      mutationFn: async (variables: { articleId: string; isRead: boolean }) => {
        return graphqlRequest(
          gql(`mutation MarkArticleRead($isRead: Boolean!, $articleId: ID!) {
              markArticleRead(isRead: $isRead, articleId: $articleId) {
                  id
              }
          }`),
          variables
        );
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: allArticlesOptions().queryKey
        });
        await queryClient.invalidateQueries({
          queryKey: feedArticlesOptions(feedId).queryKey
        });
      }
    });

  const handleMarkRead = async (articleId: string) => {
    await markArticleRead({ articleId, isRead: true });
  };

  return (
    <Flex gap="3" direction="column">
      {map(orderBy(data, "node.publishedAt", "desc"), (article) => {
        if (article.node.isRead) {
          return null;
        }

        return (
          <Card
            key={article.node.id}
            className="border border-slate-800 bg-slate-950/40 p-3 transition-all hover:border-slate-700"
          >
            <Flex gap="3" align="center" justify="between">
              <Box className="min-w-0 flex-1">
                <Heading mb="1" size="3" className="truncate">
                  <a
                    target="_blank"
                    href={article.node.link}
                    rel="noopener noreferrer"
                    className="text-white hover:text-blue-400 hover:underline"
                  >
                    {decodeHtmlEntities(article.node.title)}
                  </a>
                </Heading>
                <Flex gap="3" align="center">
                  <Text size="1" className="text-slate-500">
                    {decodeHtmlEntities(feedTitle)}
                  </Text>
                  {!isNil(article.node.publishedAt) && (
                    <Text size="1" className="text-slate-600">
                      {DateTime.fromISO(
                        article.node.publishedAt
                      ).toLocaleString()}
                    </Text>
                  )}
                </Flex>
              </Box>
              <Button
                size="2"
                color="blue"
                variant="soft"
                disabled={isMarkingRead}
                className="shrink-0 cursor-pointer"
                onClick={() => {
                  handleMarkRead(article.node.id).catch(noop);
                }}
              >
                Mark as Read
              </Button>
            </Flex>
          </Card>
        );
      })}
      {hasNextPage && (
        <Button
          color="gray"
          variant="outline"
          loading={isFetchingNextPage}
          className="mt-2 w-full cursor-pointer"
          onClick={() => {
            fetchNextPage().catch(noop);
          }}
        >
          Load More
        </Button>
      )}
    </Flex>
  );
};
