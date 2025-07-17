// eslint-disable-next-line react/naming-convention/filename
import { useQuery } from "@apollo/client";
import { Card, CardBody, Spinner } from "@heroui/react";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { createFileRoute } from "@tanstack/react-router";
import concat from "lodash/concat.js";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import uniq from "lodash/uniq.js";

import { EpisodeCard } from "../../components/episode/episode-card.tsx";
import { MainLayout } from "../../components/layouts/main-layout.tsx";
import { type GetAppearance, getAppearance } from "../../graphql/queries.ts";

const RouteComponent = () => {
  const parameters: { name: string } = Route.useParams();
  const { data, loading } = useQuery<GetAppearance>(getAppearance, {
    variables: { name: parameters.name },
  });

  const appearances = uniq(
    filter(
      map(
        concat(
          [],
          data?.appearance.bucketPullsIn,
          data?.appearance.cashedGoldenTicketIn,
          data?.appearance.guestsIn,
          data?.appearance.regularsIn,
        ),
        (episode) => episode?.number,
      ),
      (episodeNumber) => !isNil(episodeNumber),
    ),
  );

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
          <p className="text-center">Appearances: {appearances.length}</p>
          {map(appearances, (episodeNumber) => {
            return (
              <EpisodeCard episodeNumber={episodeNumber} key={episodeNumber} />
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
