import { rss } from "@ethang/intl/en/rss.ts";
import { useStore } from "@ethang/store/use-store";
import { Box, Button, Card, Flex, Heading, Skeleton } from "@radix-ui/themes";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import isNil from "lodash/isNil";
import map from "lodash/map";
import noop from "lodash/noop";
import { Trash } from "lucide-react";

import {
  allArticlesOptions,
  feedArticlesOptions,
  removeSubscriptionMutationFunction,
  subscriptionsOptions
} from "./queries.ts";
import { rssStore } from "./rss-store.ts";
import { SourceIcon } from "./source-icon.tsx";
import { UnsubscribeDialog } from "./unsubscribe-dialog.tsx";
import { decodeHtmlEntities } from "./utilities.ts";

type SubscriptionEdge = {
  cursor: string;
  node: {
    iconUrl: null | string;
    id: string;
    title: string;
    website: null | string;
  };
};

const PLACEHOLDER_WEBSITE = "about:blank";

export const Feeds = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useInfiniteQuery(subscriptionsOptions());

  const selectedFeedId = useStore(rssStore, (state) => {
    return state.selectedFeedId;
  });

  const pendingUnsubscribe = useStore(rssStore, (state) => {
    return state.pendingUnsubscribe;
  });

  const queryClient = useQueryClient();

  const { isPending: isUnsubscribing, mutateAsync: removeSubscription } =
    useMutation({
      mutationFn: removeSubscriptionMutationFunction,
      onSuccess: async (_data, variables) => {
        await queryClient.invalidateQueries({
          queryKey: subscriptionsOptions().queryKey
        });
        await queryClient.invalidateQueries({
          queryKey: allArticlesOptions().queryKey
        });
        await queryClient.invalidateQueries({
          queryKey: feedArticlesOptions(variables.feedId).queryKey
        });
        if (variables.feedId === selectedFeedId) {
          rssStore.setSelectedFeedId(null);
        }
      }
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
    fetchNextPage().catch(noop);
  };

  const handleRequestUnsubscribe = (feedId: string, title: string) => {
    rssStore.requestUnsubscribe(feedId, title);
  };

  const handleCancelUnsubscribe = () => {
    rssStore.cancelUnsubscribe();
  };

  const handleConfirmUnsubscribe = async () => {
    if (isNil(pendingUnsubscribe)) {
      return;
    }
    const { feedId } = pendingUnsubscribe;
    rssStore.cancelUnsubscribe();
    await removeSubscription({ feedId });
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
              const website = feed.website ?? PLACEHOLDER_WEBSITE;
              return (
                <div
                  key={feed.id}
                  data-testid={`feed-row-${feed.id}`}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-2"
                >
                  <span data-feed-id={feed.id}>
                    <SourceIcon
                      link={website}
                      iconUrl={feed.iconUrl}
                      className="size-4 shrink-0"
                    />
                  </span>
                  <Button
                    className="min-w-0 cursor-pointer justify-start"
                    variant={selectedFeedId === feed.id ? "solid" : "ghost"}
                    onClick={() => {
                      rssStore.setSelectedFeedId(feed.id);
                    }}
                  >
                    <span className="block w-full min-w-0 text-left wrap-break-word">
                      {decodeHtmlEntities(feed.title)}
                    </span>
                  </Button>
                  <Button
                    color="red"
                    type="button"
                    variant="soft"
                    aria-label={rss.UNSUBSCRIBE}
                    data-testid={`unsubscribe-${feed.id}`}
                    className="shrink-0 cursor-pointer p-1"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRequestUnsubscribe(
                        feed.id,
                        decodeHtmlEntities(feed.title)
                      );
                    }}
                  >
                    <Trash size={14} focusable="false" aria-hidden="true" />
                  </Button>
                </div>
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
      <UnsubscribeDialog
        isPending={isUnsubscribing}
        onClose={handleCancelUnsubscribe}
        isOpen={!isNil(pendingUnsubscribe)}
        feedTitle={pendingUnsubscribe?.title ?? ""}
        onConfirm={() => {
          handleConfirmUnsubscribe().catch(noop);
        }}
      />
    </Box>
  );
};
