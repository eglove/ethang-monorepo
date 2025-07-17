import { useQuery } from "@apollo/client";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { Card, CardBody, Spinner } from "@heroui/react";
import map from "lodash/map.js";

import { type GetEpisodes, getEpisodes } from "../../graphql/queries.ts";
import { EpisodeCard } from "./episode-card.tsx";

export const Episodes = () => {
  const { data, loading } = useQuery<GetEpisodes>(getEpisodes);

  return (
    <>
      {loading && (
        <Card>
          <CardBody className="grid place-items-center">
            <Spinner />
          </CardBody>
        </Card>
      )}
      {!loading &&
        map(data?.episodes, (episode) => {
          return (
            <EpisodeCard episodeNumber={episode.number} key={episode.number} />
          );
        })}
    </>
  );
};
