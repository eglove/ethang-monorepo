import { useQuery } from "@tanstack/react-query";
import map from "lodash/map.js";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import replace from "lodash/replace.js";

import { getVideosQuery } from "../queries/queries.ts";
import { VideoCard } from "./video-card.tsx";

export const VideoCards = () => {
  const query = useQuery(getVideosQuery);

  return (
    <div className="m-4 mx-auto grid max-w-screen-md gap-4">
      {map(query.data, (video) => {
        return (
          <VideoCard
            authorName={video.authorName}
            id={replace(video.id, "yt:video:", "")}
            isQueryLoading={query.isPending}
            key={video.id}
            published={video.published}
            title={video.title}
          />
        );
      })}
    </div>
  );
};
