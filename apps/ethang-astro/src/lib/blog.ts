import { getCollection } from "astro:content";
import map from "lodash/map.js";
import sortBy from "lodash/sortBy.js";

import { BLOG_PAGE_SIZE, toMaxPages } from "./blog-pagination.ts";

export type BlogListPost = {
  data: {
    blogCategory?: string;
    slug: string;
    title: string;
    updatedDate?: Date;
  };
};
export type BlogPostEntry = BlogListPost;

const postsDesc = async () => {
  return sortBy(await getCollection("blog"), (p) => {
    return -p.data.pubDate.getTime();
  });
};

export const fetchBlogSlugs = async () => {
  return map(await postsDesc(), (p) => {
    return p.data.slug;
  });
};
export const fetchBlogMaxPages = async () => {
  return toMaxPages((await getCollection("blog")).length);
};
export const fetchBlogPage = async (page: number) => {
  const posts = await postsDesc();
  const start = (page - 1) * BLOG_PAGE_SIZE;
  return {
    maxPages: toMaxPages(posts.length),
    posts: posts.slice(start, start + BLOG_PAGE_SIZE),
    total: posts.length
  };
};
export const fetchBlogPost = async (slug: string) => {
  return (
    (await postsDesc()).find((p) => {
      return p.data.slug === slug;
    }) ?? null
  );
};

export { BLOG_PAGE_SIZE, toMaxPages, toPageHref } from "./blog-pagination.ts";
