import { useQuery } from "@apollo/client/react";
import { useStore } from "@ethang/store/use-store";
import { Box, Button, Card, Flex, Heading, Skeleton } from "@radix-ui/themes";
import isNil from "lodash/isNil";
import map from "lodash/map";

import { GET_FEEDS } from "./queries.ts";
import { rssStore } from "./rss-store.ts";
import { decodeHtmlEntities } from "./utilities.ts";

export const Feeds = () => {
  const { data, loading } = useQuery(GET_FEEDS);
  const isPending = loading && isNil(data);

  const selectedFeedId = useStore(rssStore, (state) => {
    return state.selectedFeedId;
  });

  const sorted = isNil(data)
    ? []
    : data.subscriptions.edges.toSorted((a, b) => {
        return a.node.title.localeCompare(b.node.title);
      });

  return (
    <Box className="md:col-span-1">
      <Card className="min-h-75 border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md">
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
                rssStore.setSelectedFeedId(null);
              }}
            >
              All Feeds
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
          </Flex>
        </Skeleton>
      </Card>
    </Box>
  );
};
