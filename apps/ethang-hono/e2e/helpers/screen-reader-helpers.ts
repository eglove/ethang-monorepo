import type { NVDAPlaywright } from "@guidepup/playwright";
import type { Page } from "@playwright/test";

export const nvdaPress = async (
  nvda: NVDAPlaywright,
  key: string,
  times = 1,
) => {
  for (let index = 0; index < times; index++) {
    await nvda.press(key);
  }
};

export const navigateToWebContent = async (
  nvda: NVDAPlaywright,
  page: Page,
) => {
  await page.bringToFront();
  await nvda.navigateToWebContent();
};
