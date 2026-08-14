import { getCollection } from "astro:content";
import { DateTime } from "effect";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import sortBy from "lodash/sortBy.js";

import { BLOG_PAGE_SIZE, toMaxPages } from "./blog-pagination.ts";

export type BlogListPost = {
  data: {
    blogCategory?: string;
    slug: string;
    title: string;
    updatedDate?: DateTime.Utc;
  };
};

const entriesDesc = async () => {
  return sortBy(await getCollection("blog"), (post) => {
    return -DateTime.toEpochMillis(DateTime.unsafeMake(post.data.pubDate));
  });
};

const allPostsDesc = async () => {
  const posts = await entriesDesc();
  return map(posts, (post) => {
    const updatedDate = post.data.updatedDate;
    return {
      data: {
        slug: post.data.slug,
        title: post.data.title,
        ...(!isNil(post.data.blogCategory) && {
          blogCategory: post.data.blogCategory
        }),
        ...(!isNil(updatedDate) && {
          updatedDate: DateTime.unsafeMake(updatedDate)
        })
      }
    };
  });
};

export const fetchBlogSlugs = async () => {
  return map(await allPostsDesc(), ({ data }) => {
    return data.slug;
  });
};
export const fetchBlogMaxPages = async () => {
  const blogPosts = await getCollection("blog");
  return toMaxPages(blogPosts.length);
};
export const fetchBlogPage = async (page: number) => {
  const posts = await allPostsDesc();
  const start = (page - 1) * BLOG_PAGE_SIZE;
  return {
    maxPages: toMaxPages(posts.length),
    posts: posts.slice(start, start + BLOG_PAGE_SIZE),
    total: posts.length
  };
};
export const fetchBlogPost = async (slug: string) => {
  const posts = await entriesDesc();
  return (
    posts.find((post) => {
      return post.data.slug === slug;
    }) ?? null
  );
};

export { BLOG_PAGE_SIZE, toMaxPages, toPageHref } from "./blog-pagination.ts";
