import { Card, CardBody, Spinner } from "@heroui/react";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { useFetch } from "@hyper-fetch/react";
import map from "lodash/map.js";

import { getAllEpisodes } from "../../clients/hyper-fetch.ts";
import { EpisodeCard } from "./episode-card.tsx";

export const Episodes = () => {
  const { data, loading } = useFetch(getAllEpisodes);

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
        map(data, (episode) => {
          return (
            <EpisodeCard episodeNumber={episode.number} key={episode.number} />
          );
        })}
    </>
  );
};
