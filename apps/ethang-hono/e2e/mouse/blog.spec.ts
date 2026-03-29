import type { GetBlogs } from "../../src/models/get-blogs.ts";

import { routes } from "../../routes.ts";
import { sanityClient } from "../../src/clients/sanity.ts";
import { expect, test } from "../index.ts";

test("blog listing page loads and passes a11y", async ({ axePage }) => {
  const response = await axePage.goto(routes.blog);
  expect(response?.status()).toBe(200);
  await expect(axePage.getByRole("heading", { name: "Blog" })).toBeVisible();
  await expect(axePage.getByRole("link", { name: "RSS Feed" })).toBeVisible();
});

const blogs = await sanityClient.fetch<GetBlogs>(`*[_type == "blog"] { slug }`);

for (const blog of blogs) {
  const slug = blog.slug.current;
  test(`blog post /${slug} loads and passes a11y`, async ({ axePage }) => {
    const response = await axePage.goto(`${routes.blog}/${slug}`);
    expect(response?.status()).toBe(200);
  });
}
