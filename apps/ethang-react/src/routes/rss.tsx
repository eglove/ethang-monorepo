import { useMutation, useQuery } from "@apollo/client/react";
import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Skeleton,
  Text,
  TextField
} from "@radix-ui/themes";
import { createFileRoute, redirect } from "@tanstack/react-router";
import find from "lodash/find.js";
import forEach from "lodash/forEach.js";
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import noop from "lodash/noop.js";
import sortBy from "lodash/sortBy.js";
import trim from "lodash/trim.js";
import { DateTime } from "luxon";
import { type ReactNode, type SyntheticEvent, useState } from "react";

import { authStore } from "../components/auth/auth-store.ts";
import { MainLayout } from "../components/layout/main-layout.tsx";
import {
  ADD_SUBSCRIPTION,
  GET_SUBSCRIPTIONS_WITH_ARTICLES,
  MARK_ARTICLE_READ
} from "../components/rss/queries.ts";
import { decodeHtmlEntities } from "../components/rss/utilities.ts";

type ArticleNode = {
  feedTitle: string;
  id: string;
  isRead: boolean;
  link: string;
  publishedAt: null | string | undefined;
  title: string;
};

const RssComponent = () => {
  const { data, loading } = useQuery(GET_SUBSCRIPTIONS_WITH_ARTICLES);
  const isPending = loading && isNil(data);
  const [addSubscription, { loading: addLoading }] =
    useMutation(ADD_SUBSCRIPTION);
  const [markArticleRead] = useMutation(MARK_ARTICLE_READ);

  const [xmlUrl, setXmlUrl] = useState("");
  const [selectedFeedId, setSelectedFeedId] = useState<null | string>(null);
  const [markingArticleId, setMarkingArticleId] = useState<null | string>(null);

  const subscriptions = get(data, ["subscriptions", "edges"], []);
  const hasSubscriptions = 0 < subscriptions.length;

  const handleAddFeed = async (event: SyntheticEvent) => {
    event.preventDefault();
    const cleanUrl = trim(xmlUrl);
    if ("" === cleanUrl) {
      return;
    }

    if (isNil(URL.parse(cleanUrl))) {
      return;
    }

    await addSubscription({
      refetchQueries: [{ query: GET_SUBSCRIPTIONS_WITH_ARTICLES }],
      variables: { xmlAddress: cleanUrl }
    });
    setXmlUrl("");
  };

  const handleMarkRead = async (articleId: string) => {
    setMarkingArticleId(articleId);
    await markArticleRead({
      refetchQueries: [{ query: GET_SUBSCRIPTIONS_WITH_ARTICLES }],
      variables: { articleId, isRead: true }
    });
    setMarkingArticleId(null);
  };

  const selectedFeedEdge = isNil(selectedFeedId)
    ? null
    : find(subscriptions, (edge) => {
        return edge.node.id === selectedFeedId;
      });

  const articles: ArticleNode[] = [];
  if (isNil(selectedFeedEdge)) {
    forEach(subscriptions, (edge) => {
      const feed = edge.node;
      const feedArticles = get(feed, ["articles", "edges"], []);
      forEach(feedArticles, (artEdge) => {
        const art = artEdge.node;
        articles.push({
          feedTitle: feed.title,
          id: art.id,
          isRead: art.isRead,
          link: art.link,
          publishedAt: art.publishedAt,
          title: art.title
        });
      });
    });
  } else {
    const feed = selectedFeedEdge.node;
    const feedArticles = get(feed, ["articles", "edges"], []);
    forEach(feedArticles, (artEdge) => {
      const art = artEdge.node;
      articles.push({
        feedTitle: feed.title,
        id: art.id,
        isRead: art.isRead,
        link: art.link,
        publishedAt: art.publishedAt,
        title: art.title
      });
    });
  }

  // Sort articles by publishedAt descending, falling back to id if dates are equal or missing
  articles.sort((a, b) => {
    const timeA = isNil(a.publishedAt)
      ? 0
      : DateTime.fromISO(a.publishedAt).valueOf();
    const timeB = isNil(b.publishedAt)
      ? 0
      : DateTime.fromISO(b.publishedAt).valueOf();

    if (timeA === timeB) {
      return b.id.localeCompare(a.id);
    }

    return timeB - timeA;
  });

  let mainContent: ReactNode;
  if (!hasSubscriptions) {
    mainContent = (
      <Flex align="center" justify="center" className="py-12">
        <Text size="3" className="text-slate-500">
          No subscriptions found.
        </Text>
      </Flex>
    );
  } else if (0 === articles.length) {
    mainContent = (
      <Flex align="center" justify="center" className="py-12">
        <Text size="3" className="text-slate-500">
          No unread articles.
        </Text>
      </Flex>
    );
  } else {
    mainContent = (
      <Flex gap="3" direction="column">
        {map(articles, (art) => {
          return (
            <Card
              key={art.id}
              className="border border-slate-800 bg-slate-950/40 p-3 transition-all hover:border-slate-700"
            >
              <Flex gap="3" align="center" justify="between">
                <Box className="min-w-0 flex-1">
                  <Heading mb="1" size="3" className="truncate">
                    <a
                      href={art.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-blue-400 hover:underline"
                    >
                      {decodeHtmlEntities(art.title)}
                    </a>
                  </Heading>
                  <Flex gap="3" align="center">
                    <Text size="1" className="text-slate-500">
                      {decodeHtmlEntities(art.feedTitle)}
                    </Text>
                    {!isNil(art.publishedAt) && (
                      <Text size="1" className="text-slate-600">
                        {DateTime.fromISO(art.publishedAt).toLocaleString()}
                      </Text>
                    )}
                  </Flex>
                </Box>
                <Button
                  size="2"
                  color="blue"
                  variant="soft"
                  className="shrink-0 cursor-pointer"
                  disabled={markingArticleId === art.id}
                  onClick={() => {
                    handleMarkRead(art.id).catch(noop);
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
  }

  return (
    <MainLayout>
      <Flex gap="4" width="100%" direction="column">
        {/* Top Add Feed Form */}
        <Card className="border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md">
          <form
            onSubmit={(event) => {
              handleAddFeed(event).catch(noop);
            }}
          >
            <Flex gap="3" align="center">
              <Box className="flex-1">
                <TextField.Root
                  required
                  type="url"
                  value={xmlUrl}
                  disabled={addLoading}
                  placeholder="Feed XML URL"
                  onChange={(event) => {
                    setXmlUrl(event.target.value);
                  }}
                  className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-white transition-colors focus:border-blue-500"
                />
              </Box>
              <Button
                type="submit"
                disabled={addLoading}
                className="cursor-pointer bg-blue-600 font-semibold hover:bg-blue-500"
              >
                Add Feed
              </Button>
            </Flex>
          </form>
        </Card>

        <Grid gap="4" columns={{ initial: "1", md: "4" }}>
          {/* Sidebar */}
          <Box className="md:col-span-1">
            <Card className="min-h-[300px] border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md">
              <Heading mb="3" size="4" className="text-slate-300">
                Feeds
              </Heading>
              <Skeleton loading={isPending} data-testid="sidebar-skeleton">
                <Flex gap="2" direction="column">
                  <Button
                    style={{ justifyContent: "flex-start" }}
                    variant={isNil(selectedFeedId) ? "solid" : "ghost"}
                    className="w-full cursor-pointer justify-start text-left"
                    onClick={() => {
                      setSelectedFeedId(null);
                    }}
                  >
                    All Feeds
                  </Button>
                  {map(sortBy(subscriptions, "node.title"), (edge) => {
                    const feed = edge.node;
                    return (
                      <Button
                        key={feed.id}
                        style={{ justifyContent: "flex-start" }}
                        variant={selectedFeedId === feed.id ? "solid" : "ghost"}
                        className="w-full cursor-pointer justify-start truncate text-left"
                        onClick={() => {
                          setSelectedFeedId(feed.id);
                        }}
                      >
                        {decodeHtmlEntities(feed.title)}
                      </Button>
                    );
                  })}
                </Flex>
              </Skeleton>
            </Card>
          </Box>

          {/* Main Area */}
          <Box className="md:col-span-3">
            <Card className="min-h-[300px] border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md">
              <Heading mb="3" size="4" className="text-slate-300">
                Articles
              </Heading>

              <Skeleton loading={isPending} data-testid="articles-skeleton">
                {mainContent}
              </Skeleton>
            </Card>
          </Box>
        </Grid>
      </Flex>
    </MainLayout>
  );
};

export const Route = createFileRoute("/rss")({
  beforeLoad: () => {
    const { user } = authStore.state;
    if (isNil(user)) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        search: {
          redirect: "/rss"
        },
        to: "/login"
      });
    }
  },
  component: RssComponent
});
