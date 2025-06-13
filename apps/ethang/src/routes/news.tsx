import { Link } from "@heroui/react";
import map from "lodash/map.js";
import { NewspaperIcon } from "lucide-react";

import { MainLayout } from "../components/main-layout.tsx";
import { NewsCard } from "../components/news/news-card.tsx";
import { newsList } from "../components/news/news-list.ts";
import { TypographyH1 } from "../components/typography/typography-h1.tsx";

const RouteComponent = () => {
  return (
    <MainLayout className="max-w-[65ch]">
      <div className="grid gap-2">
        <TypographyH1 className="text-center">News</TypographyH1>
        <p className="text-center text-foreground-500">
          Recent news, events, videos, and releases I found interesting.
        </p>
      </div>
      <div className="grid gap-4 my-8">
        {map(newsList, (newsItem) => {
          return <NewsCard newsItem={newsItem} />;
        })}
      </div>
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
