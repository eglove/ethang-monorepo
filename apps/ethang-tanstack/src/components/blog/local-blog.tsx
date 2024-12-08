import type { PropsWithChildren } from "react";

import { useKnuthPlass } from "@/hooks/use-knuth-plass.ts";
import { convexQuery } from "@convex-dev/react-query";
import { TypographyH1 } from "@ethang/react-components/src/components/typography/typography-h1.tsx";
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

  useKnuthPlass();

  return (
    <MainLayout>
      <ContentHandler
        skipError
        error={blogQuery.error}
        isError={blogQuery.isError}
        isLoading={blogQuery.isLoading}
      >
        <article className="max-w-prose">
          {
            !isNil(blogQuery.data) && (
              <TypographyH1>
                {blogQuery.data.title}
              </TypographyH1>
            )
          }
          {children}
        </article>
      </ContentHandler>
    </MainLayout>
  );
};
