import AxeBuilder from "@axe-core/playwright";
import { test as base, expect } from "@playwright/test";

const A11Y_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "best-practice",
];

export const test = base.extend({
  page: async ({ page }, use) => {
    await use(page);

    // @ts-expect-error no idea
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    const results = await new AxeBuilder({ page })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .withTags(A11Y_TAGS)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .analyze();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    expect(results.violations).toEqual([]);
  },
});

export { expect } from "@playwright/test";
