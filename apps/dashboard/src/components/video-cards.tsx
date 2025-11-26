import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Link,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import map from "lodash/map.js";
import replace from "lodash/replace.js";
import { CheckLineIcon } from "lucide-react";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import LiteYouTubeEmbed from "react-lite-youtube-embed";

import { getVideosQuery } from "../queries/queries.ts";

export const VideoCards = () => {
  const query = useQuery(getVideosQuery);

  return (
    <div className="m-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {map(query.data, (video) => {
        const id = replace(video.id, "yt:video:", "");

        return (
          <Card key={id}>
            <CardHeader>
              <Link
                isExternal
                className="text-xl font-bold text-foreground underline"
                href={`https://www.youtube.com/watch?v=${id}`}
              >
                {video.title}
              </Link>
            </CardHeader>
            <CardBody>
              <LiteYouTubeEmbed id={id} title={video.title} />
            </CardBody>
            <CardFooter>
              <Button isIconOnly className="ml-auto" color="success" size="sm">
                <CheckLineIcon />
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};
