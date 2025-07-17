// eslint-disable-next-line react/naming-convention/filename
import { useQuery } from "@apollo/client";
import { Card, CardBody, Spinner } from "@heroui/react";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { createFileRoute } from "@tanstack/react-router";
import map from "lodash/map.js";

import { EpisodeCard } from "../../components/episode/episode-card.tsx";
import { MainLayout } from "../../components/layouts/main-layout.tsx";
import { type GetAppearance, getAppearance } from "../../graphql/queries.ts";

const RouteComponent = () => {
  const parameters: { name: string } = Route.useParams();
  const { data, loading } = useQuery<GetAppearance>(getAppearance, {
    variables: { name: parameters.name },
  });

  return (
    <MainLayout>
      {loading && (
        <Card>
          <CardBody className="grid place-items-center">
            <Spinner />
          </CardBody>
        </Card>
      )}
      {!loading && data && (
        <>
          <h1 className="text-3xl font-bold text-center">
            {data.appearance.name}
          </h1>
          <p className="text-center">
            Appearances: {data.appearance.episodes.length}
          </p>
          {map(data.appearance.episodes, (episode) => {
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
