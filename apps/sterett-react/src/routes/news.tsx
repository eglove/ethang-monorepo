import { useSuspenseQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map";

import { Container } from "../components/container.tsx";
import { EmptyContent } from "../components/empty-content.tsx";
import { Event } from "../components/event.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { NewsUpdate } from "../components/news-update.tsx";
import { rootRoute } from "../router/router.ts";
import { type CalendarEventReturn, getNewsAndEventsQueryOptions, type NewsUpdateReturn } from "../sanity/queries/get-news-and-events.ts";
import { getRouteQueries } from "../util/get-route-queries.ts";
import { setMeta } from "../util/set-meta.ts";

export const newsRouteQueries = {
  newsAndEvents: getNewsAndEventsQueryOptions(),
};

export const NewsRoute = () => {
  const { data } = useSuspenseQuery(newsRouteQueries.newsAndEvents);

  if (isEmpty(data)) {
    return <EmptyContent />;
  }

  return (
    <MainLayout>
      <Container styleNames="p-0">
        <div className="grid w-full p-2">
          {map(data, (datum) => {
            if (!isNil((datum as NewsUpdateReturn).date)) {
              return (
                <NewsUpdate
                  data={datum as NewsUpdateReturn}
                  key={datum._id}
                />
              );
            }

            return (
              <Event
                data={datum as CalendarEventReturn}
                key={datum._id}
              />
            );
          })}
        </div>
      </Container>
    </MainLayout>
  );
};

export const newsRoute = createRoute({
  beforeLoad() {
    setMeta({
      description: "News and Event Updates for Sterett Creek Village Trustee",
      title: "Sterett Creek Village Trustee | News",
    });
  },
  component: NewsRoute,
  errorComponent: EmptyContent,
  getParentRoute: () => {
    return rootRoute;
  },
  async loader() {
    return getRouteQueries(newsRouteQueries);
  },
  path: "/news",
});
