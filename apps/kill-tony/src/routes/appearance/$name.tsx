// eslint-disable-next-line react/naming-convention/filename
import { Card, CardBody, Spinner } from "@heroui/react";
import { useFetch } from "@hyper-fetch/react";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { createFileRoute } from "@tanstack/react-router";
import map from "lodash/map.js";

import { getAppearanceByName } from "../../clients/hyper-fetch.ts";
import { EpisodeCard } from "../../components/episode/episode-card.tsx";
import { MainLayout } from "../../components/layouts/main-layout.tsx";

const RouteComponent = () => {
  const parameters: { name: string } = Route.useParams();
  const { data, loading } = useFetch(
    getAppearanceByName.setParams({ name: parameters.name }),
  );

  return (
    <MainLayout>
      {loading && !getAppearanceByName.cache && (
        <Card>
          <CardBody className="grid place-items-center">
            <Spinner />
          </CardBody>
        </Card>
      )}
      {!loading && data && (
        <>
          <h1 className="text-3xl font-bold text-center">{data.name}</h1>
          <p className="text-center">Appearances: {data.episodes.length}</p>
          {map(data.episodes, (episode) => {
            return (
              <EpisodeCard
                episodeNumber={episode.number}
                key={episode.number}
              />
            );
          })}
        </>
      )}
    </MainLayout>
  );
};

export const Route = createFileRoute("/appearance/$name")({
  component: RouteComponent,
});
