import { routes } from "../../routes.ts";
import { expect, test } from "../index.ts";

test.describe("courses page", () => {
  test("courses page loads and passes a11y", async ({ axePage }) => {
    const response = await axePage.goto(routes.courses);
    expect.soft(response?.status()).toBe(200);
    await expect
      .soft(axePage.getByRole("heading", { name: "Recommended Courses" }))
      .toBeVisible();
  });

  test("courses page shows sign-in link when unauthenticated", async ({
    axePage,
  }) => {
    await axePage.goto(routes.courses);
    await expect
      .soft(axePage.getByRole("link", { name: "Sign In To Track Changes" }))
      .toBeVisible();
  });
});
