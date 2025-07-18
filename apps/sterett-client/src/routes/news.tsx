import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";
import map from "lodash/map";

import { Container } from "../components/container.tsx";
import { EmptyContent } from "../components/empty-content.tsx";
import { Event } from "../components/event.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { NewsUpdate } from "../components/news-update.tsx";
import {
  type CalendarEventReturn,
  getNewsAndEventsQueryOptions,
  type NewsUpdateReturn,
} from "../sanity/queries/get-news-and-events.ts";
import { getRouteQueries } from "../utilities/get-route-queries.ts";
import { setMeta } from "../utilities/set-meta.ts";

export const newsRouteQueries = {
  newsAndEvents: getNewsAndEventsQueryOptions(),
};

const RouteComponent = () => {
  const { data } = useSuspenseQuery(newsRouteQueries.newsAndEvents);

  if (isEmpty(data)) {
    return <EmptyContent />;
  }

  return (
    <MainLayout>
      <Container styleNames="p-0">
        <div className="grid w-full p-2">
          {map(data, (datum) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            if (!isNil((datum as NewsUpdateReturn).date)) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
              const dataValue = datum as NewsUpdateReturn;

              return <NewsUpdate data={dataValue} key={datum._id} />;
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const dataValue = datum as CalendarEventReturn;

            return <Event data={dataValue} key={datum._id} />;
          })}
        </div>
      </Container>
    </MainLayout>
  );
};

export const Route = createFileRoute("/news")({
  beforeLoad() {
    setMeta({
      description: "News and Event Updates for Sterett Creek Village Trustee",
      title: "Sterett Creek Village Trustee | News",
    });
  },
  component: RouteComponent,
  errorComponent: EmptyContent,
  async loader() {
    // @ts-expect-error it's fine
    return getRouteQueries(newsRouteQueries);
  },
});
