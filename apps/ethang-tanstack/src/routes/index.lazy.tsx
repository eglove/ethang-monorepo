import { convexQuery } from "@convex-dev/react-query";
import { TypographyH1 } from "@ethang/react-components/src/components/typography/typography-h1.tsx";
import { TypographyLink } from "@ethang/react-components/src/components/typography/typography-link.tsx";
import { TypographyMuted } from "@ethang/react-components/src/components/typography/typography-muted.tsx";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import isEmpty from "lodash/isEmpty.js";
import map from "lodash/map";

import { api } from "../../convex/_generated/api";
import { ContentHandler } from "../components/common/content-handler.tsx";
import { MainLayout } from "../components/layouts/main-layout";

const HomeComponent = () => {
  // @ts-expect-error in beta
  const blogs = useQuery(convexQuery(api.blogs.getAll, {}));

  return (
    <MainLayout>
      <TypographyH1 className="mb-4">
        Blog
      </TypographyH1>
      <ContentHandler
        emptyPlaceholder={
          <TypographyMuted>
            Nothing here yet.
          </TypographyMuted>
        }
        isEmpty={() => {
          return isEmpty(blogs.data);
        }}
        error={blogs.error}
        isError={blogs.isError}
        isLoading={blogs.isPending}
      >
        {map(blogs.data, (blog) => {
          return (
            <div key={blog._id}>
              <TypographyLink
                className="text-2xl font-bold"
                href={`/blog/${blog.slug}`}
              >
                {blog.title}
              </TypographyLink>
            </div>
          );
        })}
      </ContentHandler>

    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/")({
  component: HomeComponent,
});
