import { Button, Link, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import map from "lodash/map.js";
import { NewspaperIcon } from "lucide-react";

import { TypographyH1 } from "../typography/typography-h1.tsx";
import { NewsCard } from "./news-card.tsx";
import { newsStore } from "./news-store.ts";

export const NewsSummary = () => {
  const { data, isPending } = useQuery(newsStore.getNews(3));

  return (
    <div className="grid gap-4">
      <TypographyH1 className="flex items-center gap-2">
        <NewspaperIcon /> News
      </TypographyH1>
      {isPending && <Spinner />}
      {!isPending &&
        map(data?.news, (newsItem) => {
          return <NewsCard id={newsItem.id} key={newsItem.id} limit={3} />;
        })}
      <Button
        as={Link}
        className="bg-black text-white border-1 border-white"
        href="/news"
      >
        View All News
      </Button>
    </div>
  );
};
