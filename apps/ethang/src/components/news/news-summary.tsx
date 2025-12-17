import { Button, Link, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import map from "lodash/map.js";
import { NewspaperIcon } from "lucide-react";

import { TypographyH1 } from "../typography/typography-h1.tsx";
import { NewsCard } from "./news-card.tsx";
import { newsStore } from "./news-store.ts";

export const NewsSummary = () => {
  const { data, isPending } = useQuery(newsStore.getNews(1));

  return (
    <div className="grid gap-4">
      <TypographyH1 className="flex items-center gap-2">
        <NewspaperIcon /> News
      </TypographyH1>
      {isPending && <Spinner />}
      <div className="grid gap-4 sm:grid-cols-3">
        {!isPending &&
          map(data?.news, (newsItem) => {
            return <NewsCard page={1} id={newsItem.id} key={newsItem.id} />;
          })}
      </div>
      <Button
        as={Link}
        href="/news"
        className="border-1 border-white bg-black text-white"
      >
        View All News
      </Button>
    </div>
  );
};
