import { Card, CardBody, CardHeader, Link } from "@heroui/react";
import isNil from "lodash/isNil";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";

import type { newsList } from "./news-list";

import { TypographyBlockquote } from "../typography/typography-blockquote.tsx";

type NewCardProperties = {
  newsItem: (typeof newsList)[number];
};

export const NewsCard = ({ newsItem }: Readonly<NewCardProperties>) => {
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="grid gap-2 w-full">
          <Link
            isExternal
            showAnchorIcon
            className="text-foreground font-bold text-lg"
            href={newsItem.href}
            underline="always"
          >
            {newsItem.title}
          </Link>
          <p className="text-foreground-500">
            {newsItem.published.toLocaleString()}
          </p>
        </div>
      </CardHeader>
      <CardBody>
        {!isNil(newsItem.quote) && (
          <TypographyBlockquote>
            &ldquo;{newsItem.quote}&rdquo;
          </TypographyBlockquote>
        )}
        {!isNil(newsItem.youtube) && (
          <LiteYouTubeEmbed
            id={newsItem.youtube.id}
            title={newsItem.youtube.title}
          />
        )}
      </CardBody>
    </Card>
  );
};
