import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Link,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import map from "lodash/map.js";
import replace from "lodash/replace.js";
import { CheckLineIcon } from "lucide-react";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import LiteYouTubeEmbed from "react-lite-youtube-embed";

import { getVideosUrl, markVideoAsSeenUrl } from "../../shared/api-urls.ts";
import { getVideosQuery } from "../queries/queries.ts";

export const VideoCards = () => {
  const queryClient = useQueryClient();
  const query = useQuery(getVideosQuery);

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${markVideoAsSeenUrl}?id=${id}`);

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: [getVideosUrl],
        });
      }

      return response.json();
    },
  });

  return (
    <div className="m-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {map(query.data, (video) => {
        const id = replace(video.id, "yt:video:", "");

        return (
          <Card key={id}>
            <CardHeader className="text-xl font-bold">
              {video.authorName}
            </CardHeader>
            <CardBody>
              <LiteYouTubeEmbed id={id} title={video.title} />
            </CardBody>
            <CardFooter className="flex justify-between gap-4">
              <div>
                <Link
                  isExternal
                  showAnchorIcon
                  className="font-bold"
                  href={`https://www.youtube.com/watch?v=${id}`}
                >
                  {video.title}
                </Link>
                <div>
                  {new Date(video.published).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>
              <Button
                isIconOnly
                onPress={() => {
                  mutation.mutate(id);
                }}
                color="success"
                isLoading={query.isPending || mutation.isPending}
                size="sm"
              >
                <CheckLineIcon />
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};
