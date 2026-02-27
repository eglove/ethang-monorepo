import map from "lodash/map.js";
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge";

import { BlogModel } from "../../models/blog-model.ts";
import { globalStore } from "../../stores/global-store-properties.ts";
import { BlogLayout } from "../layouts/blog-layout.tsx";
import { H1 } from "../typography/h1.tsx";
import { H2 } from "../typography/h2.tsx";
import { HR } from "../typography/hr.tsx";
import { Link } from "../typography/link.tsx";
import { P } from "../typography/p.tsx";

const formattedDateTime = (dateTime: string) => {
  return DateTime.fromISO(dateTime, {
    zone: globalStore.timezone,
  }).toLocaleString({ dateStyle: "medium", timeStyle: "short" });
};

export const Blog = async () => {
  const blogModel = new BlogModel();
  const blogs = await blogModel.getAllBlogs();

  return (
    <BlogLayout
      title="Blog"
      description="Ethan Glover's blog."
      updatedAt={new Date().toISOString()}
      publishedAt={new Date().toISOString()}
    >
      <H1>Blog</H1>
      <div class="my-6 grid gap-4">
        {map(blogs, async (blog) => {
          return (
            <div>
              <div
                class={twMerge(
                  "text-base uppercase",
                  "Dev Reads" === blog.blogCategory.title && "text-fg-brand",
                  "Blog" === blog.blogCategory.title && "text-fg-purple",
                )}
              >
                {blog.blogCategory.title}
              </div>
              <H2 className="mt-0 border-none pb-0">
                <Link
                  className="text-fg-brand-subtle"
                  href={`/blog/${blog.slug.current}`}
                >
                  {blog.title}
                </Link>
              </H2>
              <P className="text-sm not-first:mt-1.5">
                Published: {formattedDateTime(blog._createdAt)}
              </P>
              <P className="text-xs italic not-first:mt-1.5">
                Updated: {formattedDateTime(blog._updatedAt)}
              </P>
              <HR />
            </div>
          );
        })}
      </div>
    </BlogLayout>
  );
};
