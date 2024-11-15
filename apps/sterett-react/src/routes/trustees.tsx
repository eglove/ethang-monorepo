import { useSuspenseQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import map from "lodash/map";

import { Container } from "../components/container.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { Trustee } from "../components/trustee.tsx";
import { rootRoute } from "../router/router.ts";
import { getTrusteesQueryOptions } from "../sanity/queries/get-trustees.ts";
import { getRouteQueries } from "../util/get-route-queries.ts";
import { setMeta } from "../util/set-meta.ts";

export const trusteesRouteQueries = {
  trustees: getTrusteesQueryOptions(),
};

export const TrusteesRoute = () => {
  const { data } = useSuspenseQuery(trusteesRouteQueries.trustees);

  return (
    <MainLayout>
      <Container>
        <div className="grid gap-4 md:grid-cols-3">
          {map(data, (trustee, index) => {
            return (
              <Trustee
                index={index}
                key={trustee._id}
                trustee={trustee}
              />
            );
          })}
        </div>
      </Container>
    </MainLayout>
  );
};

export const trusteesRoute = createRoute({
  beforeLoad() {
    setMeta({
      description:
          "Trustee contact information for Sterett Creek Village Trustee Board",
      title: "Sterett Creek Village Trustee | Trustees",
    });
  },
  component: TrusteesRoute,
  getParentRoute() {
    return rootRoute;
  },
  async loader() {
    return getRouteQueries(trusteesRouteQueries);
  },
  path: "/trustees",
});
