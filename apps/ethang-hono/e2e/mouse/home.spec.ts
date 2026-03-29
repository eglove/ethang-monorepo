import { expect, test } from "../index.ts";

test("home page loads and passes a11y", async ({ axePage }) => {
  const response = await axePage.goto("/");
  expect(response?.status()).toBe(200);
});
