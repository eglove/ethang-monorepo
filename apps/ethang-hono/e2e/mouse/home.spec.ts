import { expect, test } from "../index.ts";

test.describe("home page", () => {
  test("home page loads and passes a11y", async ({ axePage }) => {
    const response = await axePage.goto("/");
    expect.soft(response?.status()).toBe(200);
  });
});
