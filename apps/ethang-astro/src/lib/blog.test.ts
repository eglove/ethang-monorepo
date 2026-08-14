/* eslint-disable @ethang/prefer-effect-datetime */
import { Array } from "effect";
import { describe, expect, it, vi } from "vitest";

vi.mock("astro:content", () => {
	return {
		getCollection: vi.fn(),
	};
});

import { getCollection } from "astro:content";

import {
	fetchBlogMaxPages,
	fetchBlogPage,
	fetchBlogPost,
	fetchBlogSlugs,
} from "./blog.ts";

const makePost = (overrides: Record<string, unknown> = {}) => {
	return {
		data: {
			pubDate: new Date(2024, 0, 1),
			slug: "slug",
			title: "Title",
			...overrides,
		},
	};
};

const setCollection = (posts: ReturnType<typeof makePost>[]) => {
	vi.mocked(getCollection).mockResolvedValue(posts as never);
};

describe("fetchBlogSlugs", () => {
	it("returns slugs ordered by newest pubDate first", async () => {
		setCollection([
			makePost({ pubDate: new Date(2023, 0, 1), slug: "old" }),
			makePost({ pubDate: new Date(2024, 5, 1), slug: "new" }),
			makePost({ pubDate: new Date(2024, 0, 1), slug: "mid" }),
		]);

		await expect(fetchBlogSlugs()).resolves.toEqual(["new", "mid", "old"]);
	});
});

describe("fetchBlogMaxPages", () => {
	it.each([
		{
			expected: 1,
			name: "empty collection",
			posts: [] as ReturnType<typeof makePost>[],
		},
		{
			expected: 1,
			name: "single page",
			posts: Array.makeBy(5, () => {
				return makePost();
			}),
		},
		{
			expected: 2,
			name: "two pages",
			posts: Array.makeBy(11, () => {
				return makePost();
			}),
		},
	])("returns $expected for $name", async ({ expected, posts }) => {
		setCollection(posts);

		await expect(fetchBlogMaxPages()).resolves.toBe(expected);
	});
});

describe("fetchBlogPage", () => {
	it("returns the first page slice and totals", async () => {
		const posts = Array.makeBy(12, (index) => {
			return makePost({
				pubDate: new Date(2024, 0, index + 1),
				slug: `post-${String(index)}`,
			});
		});
		setCollection(posts);

		const result = await fetchBlogPage(1);

		expect(result.total).toBe(12);
		expect(result.maxPages).toBe(2);
		expect(result.posts).toHaveLength(10);
		expect(result.posts[0]?.data.slug).toBe("post-11");
	});

	it("returns an empty slice past the last page", async () => {
		setCollection(
			Array.makeBy(12, (index) => {
				return makePost({ slug: `post-${String(index)}` });
			}),
		);

		const result = await fetchBlogPage(2);

		expect(result.total).toBe(12);
		expect(result.posts).toHaveLength(2);
	});
});

describe("fetchBlogPost", () => {
	it("returns the post matching the slug", async () => {
		setCollection([
			makePost({ slug: "alpha", title: "Alpha" }),
			makePost({ slug: "beta", title: "Beta" }),
		]);

		const post = await fetchBlogPost("beta");

		expect(post?.data.title).toBe("Beta");
	});

	it("returns null when no post matches", async () => {
		setCollection([makePost({ slug: "alpha" })]);

		expect(await fetchBlogPost("missing")).toBeNull();
	});
});

describe("post mapping", () => {
	it("includes the category and updated date when present", async () => {
		setCollection([
			makePost({
				blogCategory: "tech",
				slug: "with-meta",
				updatedDate: new Date(2024, 6, 1),
			}),
		]);

		const { posts } = await fetchBlogPage(1);

		expect(posts[0]?.data).toHaveProperty("blogCategory", "tech");
		expect(posts[0]?.data).toHaveProperty("updatedDate");
	});

	it("omits the category and updated date when absent", async () => {
		setCollection([makePost({ slug: "bare" })]);

		const { posts } = await fetchBlogPage(1);

		expect(posts[0]?.data).not.toHaveProperty("blogCategory");
		expect(posts[0]?.data).not.toHaveProperty("updatedDate");
	});
});
