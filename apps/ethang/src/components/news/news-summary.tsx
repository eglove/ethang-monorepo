import { Button, Link } from "@heroui/react";
import map from "lodash/map.js";
import slice from "lodash/slice.js";
import { NewspaperIcon } from "lucide-react";

import { TypographyH1 } from "../typography/typography-h1.tsx";
import { NewsCard } from "./news-card.tsx";
import { newsList } from "./news-list.ts";

export const NewsSummary = () => {
  return (
    <div className="grid gap-4">
      <TypographyH1 className="flex items-center gap-2">
        <NewspaperIcon /> News
      </TypographyH1>
      {map(slice(newsList, 0, 3), (newsItem) => {
        return <NewsCard newsItem={newsItem} />;
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
