import { queryOptions } from "@tanstack/react-query";

import type { GetBlogBySlug } from "./get-blog-by-slug-types.ts";
import type { Blog, GetBlogs, PaginatedBlogResult } from "./get-blogs-types.ts";

import { sanityClient } from "../clients/sanity.ts";

const blogSchema = `{
    ...,
    "featuredImage": {
      "alt": featuredImage.alt,
      "asset": featuredImage.asset->{...}
    },
    "body": body[]{
      ...,
      _type == "image" => {
        ...,
        "asset": asset->{...}
      },
      _type == "videoEmbed" => {
        ...,
        "url": url
      },
      _type == "blockquote" || _type == "quote" => {
        ...,
        "quote": quote
      }
    }
  }`;

export const getAllBlogs = () => {
  return queryOptions({
    queryFn: async () => {
      return sanityClient.fetch<GetBlogs>(`*[_type == "blog"] | order(_createdAt desc) {
      _id,
      title,
      author,
      _updatedAt,
      slug,
      description,
      featuredImage->{...},
      blogCategory->{...},
      _createdAt,
    }`);
    },
    queryKey: ["getAllBlogs"]
  });
};

export const getBlogBySlug = (slug: string) => {
  return queryOptions({
    queryFn: async () => {
      return sanityClient.fetch<GetBlogBySlug>(
        `*[_type == "blog" && slug.current == $slug][0]${blogSchema}`,
        { slug }
      );
    },
    queryKey: ["getBlogBySlug", slug]
  });
};

export const getPaginatedBlogs = (page: number, pageSize: number) => {
  return queryOptions({
    queryFn: async (): Promise<PaginatedBlogResult> => {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      const result = await sanityClient.fetch<
        [{ posts: Blog[] }, { total: number }]
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
        _createdAt,
      } },
      { "total": count(*[_type == "blog"]) }
    ]`,
        { end, start }
      );

      const [{ posts }, { total }] = result;
      const maxPages = Math.ceil(total / pageSize) || 1;

      return { maxPages, posts, total };
    },
    queryKey: ["getPaginatedBlogs", page, pageSize]
  });
};
