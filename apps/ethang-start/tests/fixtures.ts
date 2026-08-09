import { test as base } from "@playwright/test";
import has from "lodash/has.js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type CoverageFixtures = {
  reportsDirectory: string;
};

const reportsDirectory = path.join("playwright-report", "coverage");

export const test = base.extend<CoverageFixtures>({
  page: async ({ page }, use, testInfo) => {
    // Coverage APIs are Chromium-only; see https://playwright.dev/docs/api/class-coverage
    const isStarted = Boolean(
      has(page, ["coverage", "startJSCoverage"]) &&
      has(page, ["coverage", "startCSSCoverage"]) &&
      (await Promise.all([
        page.coverage.startJSCoverage(),
        page.coverage.startCSSCoverage()
      ]))
    );

    // eslint-disable-next-line @ethang/no-try-catch
    try {
      await use(page);
    } finally {
      if (isStarted) {
        const [jsCoverage, cssCoverage] = await Promise.all([
          page.coverage.stopJSCoverage(),
          page.coverage.stopCSSCoverage()
        ]);

        const safeTitle = testInfo.title.replaceAll(/\s+/gu, "-");
        await mkdir(reportsDirectory, { recursive: true });
        await Promise.all([
          writeFile(
            path.join(reportsDirectory, `${safeTitle}.js.json`),
            JSON.stringify(jsCoverage, null, 2)
          ),
          writeFile(
            path.join(reportsDirectory, `${safeTitle}.css.json`),
            JSON.stringify(cssCoverage, null, 2)
          )
        ]);
      }
    }
  },

  reportsDirectory: [reportsDirectory, { auto: true }]
});

export { expect } from "@playwright/test";
