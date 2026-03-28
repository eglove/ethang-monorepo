import { routes } from "../routes.ts";
import { expect, test } from "./index.ts";

const scrollContainersTitle = "Easy Sticky Header/Footer";
const scrollbarGutterTitle = "scrollbar-gutter";

test("tips index loads and lists all tips", async ({ axePage }) => {
  const response = await axePage.goto(routes.tips);
  expect(response?.status()).toBe(200);
  await expect(
    axePage.getByRole("link", { name: scrollContainersTitle }),
  ).toBeVisible();
  await expect(
    axePage.getByRole("link", { name: scrollbarGutterTitle }),
  ).toBeVisible();
});

test("navigating to scroll-containers tip loads the page", async ({
  axePage,
}) => {
  await axePage.goto(routes.tips);
  await axePage.getByRole("link", { name: scrollContainersTitle }).click();
  await expect(
    axePage.getByRole("heading", { name: scrollContainersTitle }),
  ).toBeVisible();
});

test("navigating to scrollbar-gutter tip loads the page", async ({
  axePage,
}) => {
  await axePage.goto(routes.tips);
  await axePage.getByRole("link", { name: scrollbarGutterTitle }).click();
  await expect(
    axePage.getByRole("heading", { name: scrollbarGutterTitle }),
  ).toBeVisible();
});
