import { Card, CardBody, CardHeader, Link } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import find from "lodash/find";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import isNil from "lodash/isNil";
import LiteYouTubeEmbed from "react-lite-youtube-embed";

import { TypographyBlockquote } from "../typography/typography-blockquote.tsx";
import { newsStore } from "./news-store.ts";

type NewCardProperties = {
  id: string;
};

export const NewsCard = ({ id }: Readonly<NewCardProperties>) => {
  const { data, isPending } = useQuery({
    ...newsStore.getNews(),
    select: (_data) => {
      return find(_data.news, { id });
    },
  });

  if (isPending || isNil(data)) {
    return null;
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="grid gap-2 w-full">
          <Link
            isExternal
            showAnchorIcon
            className="text-foreground font-bold text-lg"
            href={data.href}
            underline="always"
          >
            {data.title}
          </Link>
          <p className="text-foreground-500">
            {new Date(data.published).toLocaleString(undefined, {
              dateStyle: "medium",
            })}
          </p>
        </div>
      </CardHeader>
      <CardBody>
        {!isNil(data.quote) && (
          <TypographyBlockquote>
            &ldquo;{data.quote}&rdquo;
          </TypographyBlockquote>
        )}
        {!isNil(data.youtubeVideo) && (
          <LiteYouTubeEmbed
            id={data.youtubeVideo.videoId}
            title={data.youtubeVideo.title}
          />
        )}
      </CardBody>
    </Card>
  );
};
