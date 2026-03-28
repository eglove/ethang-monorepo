import { routes } from "../routes.ts";
import { expect, test } from "./index.ts";

test("scrollbar-gutter page loads and passes a11y", async ({ axePage }) => {
  const response = await axePage.goto(routes.scrollbarGutter);
  expect(response?.status()).toBe(200);
  await expect(
    axePage.getByRole("heading", { name: "scrollbar-gutter" }),
  ).toBeVisible();
});

test("Show Extra Content button reveals hidden demo content", async ({
  axePage,
}) => {
  await axePage.goto(routes.scrollbarGutter);

  const withExample = axePage.locator("#scrollbar-gutter-with-example");
  const withoutExample = axePage.locator("#scrollbar-gutter-without-example");

  await expect(withExample).toBeHidden();
  await expect(withoutExample).toBeHidden();

  await axePage.getByRole("button", { name: "Show Extra Content" }).click();

  await expect(withExample).toBeVisible();
  await expect(withoutExample).toBeVisible();
});
