import type { PropsWithChildren } from "react";

import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import isNil from "lodash/isNil";

import { api } from "../../../convex/_generated/api";
import { ContentHandler } from "../common/content-handler.tsx";
import { MainLayout } from "../layouts/main-layout.tsx";

type LocalBlogProperties = PropsWithChildren<{
  slug: string;
}>;

export const LocalBlog = ({
  children,
  slug,
}: Readonly<LocalBlogProperties>) => {
  const blogQuery =
        // @ts-expect-error in beta
        useQuery(convexQuery(api.blogs.get, { slug }));

  return (
    <MainLayout>
      <ContentHandler
        error={blogQuery.error}
        isError={blogQuery.isError}
        isLoading={blogQuery.isLoading}
      >
        {!isNil(blogQuery.data) && (
          <article className="prose text-foreground">
            <div className="flex justify-between">
              <h1 className="text-foreground">
                {blogQuery.data.title}
              </h1>
            </div>
            {children}
          </article>
        )}
      </ContentHandler>
    </MainLayout>
  );
};
