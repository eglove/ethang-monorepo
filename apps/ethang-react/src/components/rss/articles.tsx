import { useMutation, useQuery } from "@apollo/client/react";
import { useStore } from "@ethang/store/use-store";
import { Box, Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import flatMap from "lodash/flatMap.js";
import isNil from "lodash/isNil";
import map from "lodash/map";
import noop from "lodash/noop";
import orderBy from "lodash/orderBy.js";
import { DateTime } from "luxon";

import { ALL_ARTICLES, FEED_ARTICLES, MARK_ARTICLE_READ } from "./queries.ts";
import { rssStore } from "./rss-store.ts";
import { decodeHtmlEntities } from "./utilities.ts";

type ArticlesProperties = {
  feedTitle: string;
};

export const Articles = ({ feedTitle }: Readonly<ArticlesProperties>) => {
  const feedId = useStore(rssStore, (state) => {
    return state.selectedFeedId;
  });

  const { data: allData } = useQuery(ALL_ARTICLES);

  const { data: feedData } = useQuery(FEED_ARTICLES, {
    skip: isNil(feedId),
    variables: { feedId: feedId ?? "" }
  });

  const data = isNil(feedId)
    ? flatMap(allData?.subscriptions.edges, (edge) => {
        return edge.node.articles.edges;
      })
    : feedData?.feedArticles.edges;

  const [markArticleRead, { loading: isMarkingRead }] =
    useMutation(MARK_ARTICLE_READ);

  const handleMarkRead = async (articleId: string) => {
    await markArticleRead({
      refetchQueries: [
        { query: ALL_ARTICLES },
        { query: FEED_ARTICLES, variables: { feedId } }
      ],
      variables: { articleId, isRead: true }
    });
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
    </Flex>
  );
};
