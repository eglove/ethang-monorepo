import { createClient } from "@sanity/client";
import { createServerFn } from "@tanstack/react-start";

import type { BlogPost } from "./blog-types.ts";

const sanity = createClient({
  apiVersion: "1",
  dataset: "production",
  projectId: "3rkvshhk",
  useCdn: true
});

export const getPaginatedBlogs = createServerFn()
  .validator((data: { page: number; pageSize: number }) => {
    return data;
  })
  .handler(async ({ data: { page, pageSize } }) => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    const result = await sanity.fetch<
      [{ posts: BlogPost[] }, { total: number }]
    >(
      `[
      { "posts": *[_type == "blog"] | order(_createdAt desc)[$start...$end] {
        _id,
        title,
        author,
        _updatedAt,
        slug,
        description,
        featuredImage->{...},
        blogCategory->{...},
        _createdAt
      } },
      { "total": count(*[_type == "blog"]) }
    ]`,
      { end, start }
    );

    const [{ posts }, { total }] = result;
    const maxPages = Math.ceil(total / pageSize) || 1;

    return { maxPages, posts, total };
  });
