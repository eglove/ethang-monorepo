import { AxeBuilder } from "@axe-core/playwright";
import { test as base, expect, type Page } from "@playwright/test";

export const test = base.extend<{ axePage: Page }>({
  axePage: async ({ page }, use) => {
    await use(page);
    // Skip axe analysis when the test was skipped and never navigated away from
    // the initial blank page — running axe on about:blank produces spurious
    // violations (no title, no lang, no main landmark) that are not real failures.
    if ("about:blank" === page.url()) return;
    const results = await new AxeBuilder({ page }).exclude("iframe").analyze();
    expect(results.violations).toEqual([]);
  },
});
