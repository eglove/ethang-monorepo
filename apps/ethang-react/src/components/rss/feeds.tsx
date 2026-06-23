import { rss } from "@ethang/intl/en/rss.ts";
import { useStore } from "@ethang/store/use-store";
import { Box, Button, Card, Flex, Heading, Skeleton } from "@radix-ui/themes";
import { useInfiniteQuery } from "@tanstack/react-query";
import isNil from "lodash/isNil";
import map from "lodash/map";
import noop from "lodash/noop";

import { subscriptionsOptions } from "./queries.ts";
import { rssStore } from "./rss-store.ts";
import { decodeHtmlEntities } from "./utilities.ts";

type SubscriptionEdge = {
  cursor: string;
  node: {
    id: string;
    title: string;
  };
};

export const Feeds = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useInfiniteQuery(subscriptionsOptions());

  const selectedFeedId = useStore(rssStore, (state) => {
    return state.selectedFeedId;
  });

  const edges = isNil(data)
    ? []
    : data.pages.flatMap((page: { edges: SubscriptionEdge[] }) => {
        return page.edges;
      });

  const sorted = edges.toSorted((a, b) => {
    return a.node.title.localeCompare(b.node.title);
  });

  const handleLoadMore = () => {
    if (hasNextPage) {
      fetchNextPage().catch(noop);
    }
  };

  return (
    <Box className="md:col-span-1">
      <Card className="min-h-75 border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md">
        <Heading mb="3" size="4" className="text-slate-300">
          {rss.FEEDS}
        </Heading>
        <Skeleton loading={isPending} data-testid="sidebar-skeleton">
          <Flex gap="2" direction="column">
            <Button
              style={{ justifyContent: "flex-start" }}
              variant={isNil(selectedFeedId) ? "solid" : "ghost"}
              className="w-full cursor-pointer justify-start text-left"
              onClick={() => {
                rssStore.setSelectedFeedId(null);
              }}
            >
              {rss.ALL_FEEDS}
            </Button>
            {map(sorted, (edge) => {
              const feed = edge.node;
              return (
                <Button
                  key={feed.id}
                  style={{ justifyContent: "flex-start" }}
                  variant={selectedFeedId === feed.id ? "solid" : "ghost"}
                  className="w-full cursor-pointer justify-start truncate text-left"
                  onClick={() => {
                    rssStore.setSelectedFeedId(feed.id);
                  }}
                >
                  {decodeHtmlEntities(feed.title)}
                </Button>
              );
            })}
            {hasNextPage && (
              <Button
                color="gray"
                variant="outline"
                onClick={handleLoadMore}
                loading={isFetchingNextPage}
                className="mt-1 w-full cursor-pointer"
              >
                {rss.LOAD_MORE}
              </Button>
            )}
          </Flex>
        </Skeleton>
      </Card>
    </Box>
  );
};
