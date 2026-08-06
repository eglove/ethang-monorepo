import { Card, Heading, Link, Pagination, Text } from "@astryxdesign/core";
import {
  createFileRoute,
  useLoaderData,
  useNavigate,
  useSearch
} from "@tanstack/react-router";
import { Effect, Predicate } from "effect";
import map from "lodash/map.js";

import { MainLayout } from "../../components/layouts/main-layout.tsx";
import { getPaginatedBlogs } from "../../models/blog.ts";
import { formattedDateTime } from "../../utils/formatted-date-time.ts";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
  validateSearch: (search) => {
    const page = search["page"];

    return {
      page: Predicate.isNumber(page) ? page : 1
    };
  },
  // loaderDeps
  loaderDeps: ({ search }) => {
    return {
      page: search.page
    };
  },
  // loader
  loader: async ({ deps }: { deps: { page: number } }) => {
    return getPaginatedBlogs({ data: { page: deps.page, pageSize: 10 } });
  }
});

function BlogIndex() {
  const data = useLoaderData({ from: Route.id });
  const search = useSearch({ from: Route.id });
  const navigate = useNavigate({ from: Route.id });

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center gap-2">
        <Heading level={1}>Blog</Heading>
        <div className="my-6 grid w-full gap-4">
          {map(data.posts, (blog) => {
            return (
              <Card key={blog._id}>
                <Text
                  className="uppercase"
                  color={
                    "Dev Reads" === blog.blogCategory?.title
                      ? "accent"
                      : "primary"
                  }
                >
                  {blog.blogCategory?.title}
                </Text>
                <Heading level={2}>
                  <Link href={`/blog/${blog.slug.current}`}>{blog.title}</Link>
                </Heading>
                <Text as="p" size="sm" className="italic">
                  Updated: {formattedDateTime(blog._updatedAt)}
                </Text>
              </Card>
            );
          })}
        </div>
        <Pagination
          page={search.page}
          totalPages={data.maxPages}
          onChange={(newPage) => {
            navigate({
              search: { page: newPage }
            }).catch(Effect.logError);
          }}
        />
      </div>
    </MainLayout>
  );
}
