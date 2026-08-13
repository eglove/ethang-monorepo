import { getCollection } from "astro:content";
import sortBy from "lodash/sortBy.js";
import { BLOG_PAGE_SIZE, toMaxPages, toPageHref } from "./blog-pagination.ts";

export { BLOG_PAGE_SIZE, toMaxPages, toPageHref };

export type BlogListPost = {
	data: { title: string; slug: string; blogCategory?: string; updatedDate?: Date };
};
export type BlogPostEntry = BlogListPost;

const postsDesc = async () =>
	sortBy(await getCollection("blog"), (p) => -p.data.pubDate.getTime());

export const fetchBlogSlugs = async () => (await postsDesc()).map((p) => p.data.slug);
export const fetchBlogMaxPages = async () => toMaxPages((await getCollection("blog")).length);
export const fetchBlogPage = async (page: number) => {
	const posts = await postsDesc();
	const start = (page - 1) * BLOG_PAGE_SIZE;
	return {
		maxPages: toMaxPages(posts.length),
		posts: posts.slice(start, start + BLOG_PAGE_SIZE),
		total: posts.length
	};
};
export const fetchBlogPost = async (slug: string) =>
	(await postsDesc()).find((p) => p.data.slug === slug) ?? null;