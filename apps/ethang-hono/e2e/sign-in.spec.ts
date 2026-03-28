import { expect, test } from "./index.ts";

test("sign-in page loads and passes a11y", async ({ axePage }) => {
  const response = await axePage.goto("/sign-in");
  expect(response?.status()).toBe(200);
});

test("sign-in form has accessible email and password fields", async ({
  axePage,
}) => {
  await axePage.goto("/sign-in");
  await expect(axePage.getByLabel("Email")).toBeVisible();
  await expect(axePage.getByLabel("Password")).toBeVisible();
  await expect(axePage.getByRole("button", { name: "Submit" })).toBeVisible();
});
