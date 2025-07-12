import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import map from "lodash/map";

import { Container } from "../components/container.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { Trustee } from "../components/trustee.tsx";
import { getTrusteesQueryOptions } from "../sanity/queries/get-trustees.ts";
import { getRouteQueries } from "../utilities/get-route-queries.ts";
import { setMeta } from "../utilities/set-meta.ts";

export const trusteesRouteQueries = {
  trustees: getTrusteesQueryOptions(),
};

const RouteComponent = () => {
  const { data } = useSuspenseQuery(trusteesRouteQueries.trustees);

  return (
    <MainLayout>
      <Container>
        <div className="grid gap-4 md:grid-cols-3">
          {map(data, (trustee, index) => {
            return (
              <Trustee index={index} key={trustee._id} trustee={trustee} />
            );
          })}
        </div>
      </Container>
    </MainLayout>
  );
};

export const Route = createFileRoute("/trustees")({
  beforeLoad() {
    setMeta({
      description:
        "Trustee contact information for Sterett Creek Village Trustee Board",
      title: "Sterett Creek Village Trustee | Trustees",
    });
  },
  component: RouteComponent,
  async loader() {
    // @ts-expect-error it's fine
    return getRouteQueries(trusteesRouteQueries);
  },
});
