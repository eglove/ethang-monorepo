import { useStore } from "@ethang/store/use-store";
import { Card, Heading, Spinner, Text } from "@radix-ui/themes";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DateTime } from "effect";
import isNil from "lodash/isNil.js";
import map from "lodash/map";
import { twMerge } from "tailwind-merge";

import { BlogPagination } from "../../components/blog/blog-pagination.tsx";
import { blogStore } from "../../components/blog/blog-store.ts";
import { InternalLink } from "../../components/internal-link.tsx";
import { MainLayout } from "../../components/layout/main-layout.tsx";
import { getPaginatedBlogs } from "../../models/blog-model.ts";

const formattedDateTime = (dateTime: string) => {
  return DateTime.format(DateTime.unsafeMake(dateTime), {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

const RouteComponent = () => {
  const { page } = useStore(blogStore, (state) => {
    return {
      page: state.paginationPage
    };
  });

  const { data, isPending } = useQuery({
    ...getPaginatedBlogs(page, 10),
    placeholderData: keepPreviousData
  });

  const hasData = !isPending && !isNil(data?.posts);

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center gap-2">
        <Heading as="h1" size="8">
          Blog
        </Heading>
        <div className="my-6 grid w-full gap-4">
          {!hasData && <Spinner size="3" className="mx-auto" />}
          {hasData &&
            map(data.posts, (blog) => {
              return (
                <Card key={blog._id}>
                  <div
                    className={twMerge(
                      "uppercase",
                      "Dev Reads" === blog.blogCategory.title && "text-sky-300",
                      "Blog" === blog.blogCategory.title && "text-sky-300"
                    )}
                  >
                    {blog.blogCategory.title}
                  </div>
                  <Heading as="h2" size="6">
                    <InternalLink
                      underline="hover"
                      href={`/blog/${blog.slug.current}`}
                    >
                      {blog.title}
                    </InternalLink>
                  </Heading>
                  <Text as="p" size="2" className="italic">
                    Updated: {formattedDateTime(blog._updatedAt)}
                  </Text>
                </Card>
              );
            })}
        </div>
        <BlogPagination />
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute("/blog/")({
  component: RouteComponent
});
