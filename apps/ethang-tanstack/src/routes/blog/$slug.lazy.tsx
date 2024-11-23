// eslint-disable-next-line react/naming-convention/filename
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import isNil from "lodash/isNil";

import { api } from "../../../convex/_generated/api";
import { ContentHandler } from "../../components/common/content-handler.tsx";
import { MainLayout } from "../../components/layouts/main-layout.tsx";

const RouteComponent = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const parameters = Route.useParams() as unknown as { slug: string };
  const blogQuery =
    // @ts-expect-error in beta
    useQuery(convexQuery(api.blogs.get, { slug: parameters.slug }));

  return (
    <MainLayout>
      <ContentHandler
        error={blogQuery.error}
        isError={blogQuery.isError}
        isLoading={blogQuery.isLoading}
      >
        {!isNil(blogQuery.data) && (
          <article className="prose">
            <div className="flex justify-between">
              <h1 className="text-foreground">
                {blogQuery.data.title}
              </h1>
            </div>
          </article>
        )}
      </ContentHandler>
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/blog/$slug")({
  component: RouteComponent,
});
