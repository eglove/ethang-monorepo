import { convexQuery } from "@convex-dev/react-query";
import { Link } from "@nextui-org/link";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import map from "lodash/map";

import { api } from "../../convex/_generated/api";
import { ErrorAndLoading } from "../components/common/error-and-loading.tsx";
import { MainLayout } from "../components/layouts/main-layout";

const HomeComponent = () => {
  // @ts-expect-error beta
  const blogs = useQuery(convexQuery(api.blogs.getAll, {}));

  console.log(blogs.data);

  return (
    <MainLayout>
      <ErrorAndLoading
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
      </ErrorAndLoading>

    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/")({
  component: HomeComponent,
});
