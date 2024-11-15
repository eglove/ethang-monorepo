import { useSuspenseQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import map from "lodash/map";

import { BeyonderAddress } from "../components/beyonder/beyonder-address.tsx";
import { BeyonderHero } from "../components/beyonder/beyonder-hero.tsx";
import { BeyonderLinks } from "../components/beyonder/beyonder-links.tsx";
import { Container } from "../components/container.tsx";
import { EmptyContent } from "../components/empty-content.tsx";
import { Event } from "../components/event.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { rootRoute } from "../router/router.ts";
import { getBeyonderEventsQueryOptions } from "../sanity/queries/get-beyonder-events.ts";
import { getRouteQueries } from "../util/get-route-queries.ts";
import { setMeta } from "../util/set-meta.ts";

export const beyonderRouteQueries = {
  events: getBeyonderEventsQueryOptions(),
};

export const BeyonderRoute = () => {
  const { data } = useSuspenseQuery(beyonderRouteQueries.events);

  return (
    <MainLayout>
      <Container styleNames="p-0">
        <BeyonderHero />
        <BeyonderLinks />
        <BeyonderAddress />
        <div className="grid w-full gap-4 p-2">
          {map(data, (datum) => {
            return (
              <Event
                colors={{
                  eventBackground: "beyonderGreen",
                  eventText: "text-white",
                }}
                iconMeta={{
                  alt: "Beyonder Camp",
                  src: "/images/beyonder.png",
                }}
                data={datum}
                key={datum._id}
              />
            );
          })}
        </div>
      </Container>
    </MainLayout>
  );
};

export const beyonderRoute = createRoute({
  beforeLoad() {
    setMeta({
      description: "Event Updates for Beyonder Camp",
      title: "Beyonder Camp Events",
    });
  },
  component: BeyonderRoute,
  errorComponent: EmptyContent,
  getParentRoute() {
    return rootRoute;
  },
  async loader() {
    return getRouteQueries(beyonderRouteQueries);
  },
  path: "/beyonder",
});
