import { routes } from "../routes.ts";
import { expect, test } from "./index.ts";

test("scroll-containers page loads and passes a11y", async ({ axePage }) => {
  const response = await axePage.goto(routes.scrollContainers);
  expect(response?.status()).toBe(200);
  await expect(
    axePage.getByRole("heading", { name: "Easy Sticky Header/Footer" }),
  ).toBeVisible();
});

test("scroll-containers page shows CSS and Tailwind code examples", async ({
  axePage,
}) => {
  await axePage.goto(routes.scrollContainers);
  await expect(axePage.getByRole("heading", { name: "CSS" })).toBeVisible();
  await expect(
    axePage.getByRole("heading", { name: "Tailwind" }),
  ).toBeVisible();
  await expect(axePage.getByRole("heading", { name: "Demo" })).toBeVisible();
});
