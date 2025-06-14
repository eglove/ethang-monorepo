import { Button, Link, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { NewspaperIcon } from "lucide-react";
import { useState } from "react";

import { MainLayout } from "../components/main-layout.tsx";
import { NewsCard } from "../components/news/news-card.tsx";
import { newsStore } from "../components/news/news-store.ts";
import { TypographyH1 } from "../components/typography/typography-h1.tsx";

const RouteComponent = () => {
  const [limit, setLimit] = useState(5);
  const { data, isPending } = useQuery(newsStore.getNews(limit));
  const hasMore = isNil(data?.pagination)
    ? false
    : limit <= data.pagination.total;

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
        {map(data?.news, (newsItem) => {
          return <NewsCard id={newsItem.id} key={newsItem.id} limit={limit} />;
        })}
      </div>
      {hasMore && (
        <div className="grid justify-center my-4">
          <Button
            onPress={() => {
              setLimit((previousState) => {
                return previousState + 5;
              });
            }}
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
