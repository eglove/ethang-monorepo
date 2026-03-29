import { routes } from "../../routes.ts";
import { expect, test } from "../index.ts";

const SCROLL_CONTAINERS_TITLE = "Easy Sticky Header/Footer";
const SCROLLBAR_GUTTER_TITLE = "scrollbar-gutter";

test("tips index loads and lists all tips", async ({ axePage }) => {
  const response = await axePage.goto(routes.tips);
  expect(response?.status()).toBe(200);
  await expect(
    axePage.getByRole("link", { name: SCROLL_CONTAINERS_TITLE }),
  ).toBeVisible();
  await expect(
    axePage.getByRole("link", { name: SCROLLBAR_GUTTER_TITLE }),
  ).toBeVisible();
});

test("navigating to scroll-containers tip loads the page", async ({
  axePage,
}) => {
  await axePage.goto(routes.tips);
  await axePage.getByRole("link", { name: SCROLL_CONTAINERS_TITLE }).click();
  await expect(
    axePage.getByRole("heading", { name: SCROLL_CONTAINERS_TITLE }),
  ).toBeVisible();
});

test("navigating to scrollbar-gutter tip loads the page", async ({
  axePage,
}) => {
  await axePage.goto(routes.tips);
  await axePage.getByRole("link", { name: SCROLLBAR_GUTTER_TITLE }).click();
  await expect(
    axePage.getByRole("heading", { name: SCROLLBAR_GUTTER_TITLE }),
  ).toBeVisible();
});
