import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import isNil from "lodash/isNil";

import { queryClient } from "../__root.tsx";
import { Container } from "../../components/container.tsx";
import { EmptyContent } from "../../components/empty-content.tsx";
import { MainLayout } from "../../components/layouts/main-layout.tsx";
import { SanityContent } from "../../components/sanity/sanity-content.tsx";
import { getPageQueryOptions } from "../../sanity/queries/get-page.ts";
import { setMeta } from "../../utilities/set-meta.ts";

const RouteComponent = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const { id } = Route.useParams() as unknown as { id: string };
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

export const Route = createFileRoute("/page/$id")({
  beforeLoad(context) {
    setMeta({
      description: "Sterett Creek Village Trustee",
      title: `Sterett Creek Village Trustee | ${context.params.id}`,
    });
  },
  component: RouteComponent,
  errorComponent: EmptyContent,
  async loader(context) {
    return queryClient.ensureQueryData(getPageQueryOptions(context.params.id));
  },
});
