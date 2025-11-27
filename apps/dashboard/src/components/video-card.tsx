import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Link,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckLineIcon } from "lucide-react";
import LiteYouTubeEmbed from "react-lite-youtube-embed";

import { getVideosUrl, markVideoAsSeenUrl } from "../../shared/api-urls.ts";

type VideoCardProperties = {
  authorName: string;
  id: string;
  isQueryLoading: boolean;
  published: string;
  title: string;
};

export const VideoCard = ({
  authorName,
  id,
  isQueryLoading,
  published,
  title,
}: Readonly<VideoCardProperties>) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
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
    <Card>
      <CardHeader className="text-xl font-bold">{authorName}</CardHeader>
      <CardBody>
        <LiteYouTubeEmbed id={id} title={title} />
      </CardBody>
      <CardFooter className="flex justify-between gap-4">
        <div>
          <Link
            isExternal
            showAnchorIcon
            className="font-bold"
            href={`https://www.youtube.com/watch?v=${id}`}
          >
            {title}
          </Link>
          <div>
            {new Date(published).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </div>
        </div>
        <Button
          isIconOnly
          onPress={() => {
            mutation.mutate();
          }}
          color="success"
          isDisabled={isQueryLoading}
          isLoading={mutation.isPending}
          key={id}
          size="sm"
        >
          <CheckLineIcon />
        </Button>
      </CardFooter>
    </Card>
  );
};
