import { Button, Link, Spinner } from "@heroui/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { NewspaperIcon } from "lucide-react";
import { Fragment } from "react";

import { MainLayout } from "../components/main-layout.tsx";
import { NewsCard } from "../components/news/news-card.tsx";
import { newsStore } from "../components/news/news-store.ts";
import { TypographyH1 } from "../components/typography/typography-h1.tsx";

const RouteComponent = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useInfiniteQuery({
      initialPageParam: 1,
      queryFn: async ({ pageParam }) => {
        return newsStore.getNewsQuery(pageParam);
      },
      queryKey: ["news"],
      staleTime: 0,
      // pagination
      getNextPageParam: (lastPage, __, lastPageParameter) => {
        if (lastPageParameter < lastPage.pagination.totalPages) {
          return lastPageParameter + 1;
        }

        return null;
      },
      getPreviousPageParam: (_, __, lastPageParameter) => {
        return lastPageParameter - 1;
      },
    });

  return (
    <MainLayout className="max-w-[65ch]">
      <div className="grid gap-2">
        <TypographyH1 className="text-center">News</TypographyH1>
        <p className="text-center text-foreground-500">
          Recent news, events, videos, and releases I found interesting.
        </p>
      </div>
      {isPending && isNil(data) && (
        <div className="w-full text-center my-4">
          <Spinner />
        </div>
      )}
      <div className="grid gap-4 my-8">
        {map(data?.pages, (page, index) => {
          return (
            <Fragment key={page.pagination.page}>
              {map(page.news, (newsItem) => {
                return (
                  <NewsCard
                    id={newsItem.id}
                    key={newsItem.id}
                    page={index + 1}
                  />
                );
              })}
            </Fragment>
          );
        })}
      </div>
      {hasNextPage && (
        <div className="grid justify-center my-4">
          <Button
            onPress={() => {
              fetchNextPage().catch(globalThis.console.error);
            }}
            isLoading={isFetchingNextPage}
          >
            Load More
          </Button>
        </div>
      )}
      <div className="items-center flex gap-2 justify-center text-foreground-500">
        <NewspaperIcon />
        Have a suggestion?
        <Link
          isExternal
          className="text-foreground-500"
          href="mailto:hello@ethang.email"
          underline="always"
        >
          Send me a link
        </Link>
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute({
  component: RouteComponent,
});
