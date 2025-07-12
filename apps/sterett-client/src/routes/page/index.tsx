import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import map from "lodash/map";

import { Container } from "../../components/container.tsx";
import { EmptyContent } from "../../components/empty-content.tsx";
import { MainLayout } from "../../components/layouts/main-layout.tsx";
import { Link } from "../../components/link.tsx";
import { getAllPagesQueryOptions } from "../../sanity/queries/get-all-pages.ts";
import { getRouteQueries } from "../../utilities/get-route-queries.ts";
import { setMeta } from "../../utilities/set-meta.ts";

export const pageRouteQueries = {
  pages: getAllPagesQueryOptions(),
};

const RouteComponent = () => {
  const { data } = useSuspenseQuery(pageRouteQueries.pages);

  return (
    <MainLayout>
      <Container>
        {map(data, (page) => {
          return (
            <div className="w-full" key={page._id}>
              <Link
                className="underline"
                href={`/page/${page.slug.current}`}
                key={page._id}
              >
                {page.title}
              </Link>
            </div>
          );
        })}
      </Container>
    </MainLayout>
  );
};

export const Route = createFileRoute("/page/")({
  beforeLoad() {
    setMeta({
      description: "Additional pages for Sterett Creek Village Trustee",
      title: "Sterett Creek Village Trustee | Pages",
    });
  },
  component: RouteComponent,
  errorComponent: EmptyContent,
  async loader() {
    // @ts-expect-error it's fine
    return getRouteQueries(pageRouteQueries);
  },
});
