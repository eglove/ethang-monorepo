import { expect, type Page } from "@playwright/test";

export const assertHeading = async (
  page: Page,
  pageName: string
): Promise<void> => {
  await expect
    .soft(page.getByRole("heading", { name: pageName }))
    .toBeVisible();
};

export const assertTitleAndNavigation = async (
  page: Page,
  path: string,
  title: string
): Promise<void> => {
  await page.goto(path);
  await expect.soft(page).toHaveTitle(title);
  await expect.soft(page.getByRole("navigation")).toBeVisible();
};
