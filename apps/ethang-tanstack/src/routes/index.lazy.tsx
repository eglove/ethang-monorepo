import { convexQuery } from "@convex-dev/react-query";
import { Link } from "@nextui-org/link";
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
      <ContentHandler
        isEmpty={() => {
          return isEmpty(blogs.data);
        }}
        emptyPlaceholder="Nothing here yet."
        error={blogs.error}
        isError={blogs.isError}
        isLoading={blogs.isPending}
      >
        {map(blogs.data, (blog) => {
          return (
            <div>
              <Link
                className="text-foreground text-2xl font-bold"
                href={`/blog/${blog.slug}`}
                underline="always"
              >
                {blog.title}
              </Link>
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
