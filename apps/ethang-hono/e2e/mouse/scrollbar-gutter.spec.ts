import { routes } from "../../routes.ts";
import { expect, test } from "../index.ts";

const WITH_EXAMPLE = "#scrollbar-gutter-with-example";
const WITHOUT_EXAMPLE = "#scrollbar-gutter-without-example";

test.describe("scrollbar-gutter", () => {
  test("scrollbar-gutter page loads and passes a11y", async ({ axePage }) => {
    const response = await axePage.goto(routes.scrollbarGutter);
    expect.soft(response?.status()).toBe(200);
    await expect
      .soft(axePage.getByRole("heading", { name: "scrollbar-gutter" }))
      .toBeVisible();
  });

  test("show extra content button reveals hidden demo content", async ({
    axePage,
  }) => {
    await axePage.goto(routes.scrollbarGutter);

    const withExample = axePage.locator(WITH_EXAMPLE);
    const withoutExample = axePage.locator(WITHOUT_EXAMPLE);

    await expect.soft(withExample).toBeHidden();
    await expect.soft(withoutExample).toBeHidden();

    await axePage.getByRole("button", { name: "Show extra content" }).click();

    await expect.soft(withExample).toBeVisible();
    await expect.soft(withoutExample).toBeVisible();
  });

  test("hide extra content button hides demo content again", async ({
    axePage,
  }) => {
    await axePage.goto(routes.scrollbarGutter);

    await axePage.getByRole("button", { name: "Show extra content" }).click();

    await axePage.getByRole("button", { name: "Hide extra content" }).click();

    await expect.soft(axePage.locator(WITH_EXAMPLE)).toBeHidden();
    await expect.soft(axePage.locator(WITHOUT_EXAMPLE)).toBeHidden();
  });
});
