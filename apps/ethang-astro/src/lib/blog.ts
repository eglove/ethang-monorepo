import map from "lodash/map.js";

import { sanityClient } from "./sanity.ts";

export const BLOG_PAGE_SIZE = 10;

export type BlogListPost = {
  _id: string;
  _updatedAt: string;
  blogCategory?: { title?: null | string } | null;
  slug: { current: string };
  title: string;
};

const BLOG_LIST_QUERY = `{
  "posts": *[_type == "blog"] | order(_createdAt desc)[$start...$end]{
    _id,
    _updatedAt,
    title,
    slug,
    blogCategory->{title}
  },
  "total": count(*[_type == "blog"])
}`;

const BLOG_SLUGS_QUERY = `*[_type == "blog" && defined(slug.current)] | order(_createdAt desc){
  "slug": slug.current
}`;

const BLOG_TOTAL_QUERY = `count(*[_type == "blog"])`;

const BLOG_POST_QUERY = `*[_type == "blog" && slug.current == $slug][0]{
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

export const toMaxPages = (total: number) => {
  if (0 >= total) {
    return 1;
  }

  return Math.ceil(total / BLOG_PAGE_SIZE);
};

export const toPageHref = (page: number) => {
  if (1 >= page) {
    return "/blog";
  }

  return `/blog/page/${page}`;
};

export const fetchBlogPage = async (page: number) => {
  const start = (page - 1) * BLOG_PAGE_SIZE;

  const result = await sanityClient.fetch<{
    posts: BlogListPost[];
    total: number;
  }>(BLOG_LIST_QUERY, { end: start + BLOG_PAGE_SIZE, start });

  return {
    maxPages: toMaxPages(result.total),
    posts: result.posts,
    total: result.total
  };
};

export const fetchBlogMaxPages = async () => {
  const total = await sanityClient.fetch<number>(BLOG_TOTAL_QUERY);

  return toMaxPages(total);
};

type BlogSlugRow = {
  slug: string;
};

export const fetchBlogSlugs = async () => {
  const rows = await sanityClient.fetch<BlogSlugRow[]>(BLOG_SLUGS_QUERY);

  return map(rows, "slug");
};

export const fetchBlogPost = async (slug: string) => {
  return sanityClient.fetch<{
    body?: unknown;
    title?: string;
  } | null>(BLOG_POST_QUERY, { slug });
};
