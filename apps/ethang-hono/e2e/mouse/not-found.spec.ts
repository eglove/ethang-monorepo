import { expect, test } from "../index.ts";

test("unknown route shows 404 page and passes a11y", async ({ axePage }) => {
  const response = await axePage.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(
    axePage.getByRole("heading", { name: "404 Not Found" }),
  ).toBeVisible();
});
