import { AxeBuilder } from "@axe-core/playwright";
import { test as base, expect, type Page } from "@playwright/test";

export const test = base.extend<{ axePage: Page }>({
  axePage: async ({ page }, use) => {
    await use(page);
    const results = await new AxeBuilder({ page }).exclude("iframe").analyze();
    expect(results.violations).toEqual([]);
  },
});
