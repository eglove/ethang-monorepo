import { useSuspenseQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import isNil from "lodash/isNil";

import { Container } from "../components/container.tsx";
import { EmptyContent } from "../components/empty-content.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { SanityContent } from "../components/sanity/sanity-content.tsx";
import { rootRoute } from "../router/router.ts";
import { getPageQueryOptions } from "../sanity/queries/get-page.ts";
import { setMeta } from "../util/set-meta.ts";
import { queryClient } from "./root.tsx";

export const PageIdRoute = () => {
  const { id } = pageIdRoute.useParams() as unknown as { id: string };
  const { data } = useSuspenseQuery(getPageQueryOptions(id));

  if (isNil(data)) {
    return <EmptyContent />;
  }

  return (
    <MainLayout>
      <Container>
        <SanityContent value={data.content} />
      </Container>
    </MainLayout>
  );
};

export const pageIdRoute = createRoute({
  beforeLoad(context) {
    setMeta({
      description: "Sterett Creek Village Trustee",
      title: `Sterett Creek Village Trustee | ${context.params.id}`,
    });
  },
  component: PageIdRoute,
  errorComponent: EmptyContent,
  getParentRoute: () => {
    return rootRoute;
  },
  async loader(context) {
    return queryClient.ensureQueryData(getPageQueryOptions(context.params.id));
  },
  path: "/page/$id",
});
