import { useSuspenseQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import isNil from "lodash/isNil.js";

import { Container } from "../components/container.tsx";
import { EmptyContent } from "../components/empty-content.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { SanityContent } from "../components/sanity/sanity-content.tsx";
import { UpcomingEvents } from "../components/upcoming-events.tsx";
import { rootRoute } from "../router/router.ts";
import { getEventsQueryOptions } from "../sanity/queries/get-events.ts";
import { getGalleryImagesCountQueryOptions } from "../sanity/queries/get-gallery-images-count.ts";
import { getNewsAndEventsQueryOptions } from "../sanity/queries/get-news-and-events.ts";
import { getPageQueryOptions } from "../sanity/queries/get-page.ts";
import { getRouteQueries } from "../util/get-route-queries.ts";
import { setMeta } from "../util/set-meta.ts";

export const indexRouteQueries = {
  events: getEventsQueryOptions(),
  galleryImagesCount: getGalleryImagesCountQueryOptions(),
  newsAndEvents: getNewsAndEventsQueryOptions(),
  pageData: getPageQueryOptions("home"),
};

export const HomeRoute = () => {
  const { data } = useSuspenseQuery(indexRouteQueries.pageData);

  if (isNil(data?.content)) {
    return <EmptyContent />;
  }

  return (
    <MainLayout>
      <Container>
        <UpcomingEvents />
        <SanityContent value={data.content} />
      </Container>
    </MainLayout>
  );
};

export const indexRoute = createRoute({
  beforeLoad() {
    setMeta({
      description: "Homepage of the Sterett Creek Village Trustee Board",
      title: "Sterett Creek Village Trustee | Home",
    });
  },
  component: HomeRoute,
  errorComponent: EmptyContent,
  getParentRoute: () => {
    return rootRoute;
  },
  async loader() {
    return getRouteQueries(indexRouteQueries);
  },
  path: "/",
});
