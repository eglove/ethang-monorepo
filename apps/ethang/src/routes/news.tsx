import { Link, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import map from "lodash/map.js";
import { NewspaperIcon } from "lucide-react";

import { MainLayout } from "../components/main-layout.tsx";
import { NewsCard } from "../components/news/news-card.tsx";
import { newsStore } from "../components/news/news-store.ts";
import { TypographyH1 } from "../components/typography/typography-h1.tsx";

const RouteComponent = () => {
  const { data, isPending } = useQuery(newsStore.getNews());

  return (
    <MainLayout className="max-w-[65ch]">
      <div className="grid gap-2">
        <TypographyH1 className="text-center">News</TypographyH1>
        <p className="text-center text-foreground-500">
          Recent news, events, videos, and releases I found interesting.
        </p>
      </div>
      {isPending && (
        <div className="w-full my-8 text-center">
          <Spinner />
        </div>
      )}
      {!isPending && (
        <div className="grid gap-4 my-8">
          {map(data?.news, (newsItem) => {
            return <NewsCard id={newsItem.id} />;
          })}
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
