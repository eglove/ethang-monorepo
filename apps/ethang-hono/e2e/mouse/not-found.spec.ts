import { expect, test } from "../index.ts";

test.describe("404 page", () => {
  test("unknown route shows 404 page and passes a11y", async ({ axePage }) => {
    const response = await axePage.goto("/this-page-does-not-exist");
    expect.soft(response?.status()).toBe(404);
    await expect
      .soft(axePage.getByRole("heading", { name: "404 Not Found" }))
      .toBeVisible();
  });
});
