import get from "lodash/get.js";

import type { GetBlogs } from "../../src/models/get-blogs.ts";

import { routes } from "../../routes.ts";
import { sanityClient } from "../../src/clients/sanity.ts";
import { expect, test } from "../index.ts";

const blogs = await sanityClient.fetch<GetBlogs>(`*[_type == "blog"] { slug }`);

test.describe("blog pages", () => {
  test("blog listing page loads and passes a11y", async ({ axePage }) => {
    const response = await axePage.goto(routes.blog);
    expect.soft(response?.status()).toBe(200);
    await expect
      .soft(axePage.getByRole("heading", { name: "Blog" }))
      .toBeVisible();
    await expect
      .soft(axePage.getByRole("link", { name: "RSS Feed" }))
      .toBeVisible();
  });

  for (const blog of blogs) {
    const slug = get(blog, ["slug", "current"]);

    test(`blog post /${slug} loads and passes a11y`, async ({ axePage }) => {
      const response = await axePage.goto(`${routes.blog}/${slug}`);
      expect.soft(response?.status()).toBe(200);
    });
  }
});
