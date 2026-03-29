import { screenReaderConfig } from "@guidepup/playwright";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  ...screenReaderConfig,
  projects: [
    {
      name: "screen-reader",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: [["html"], ["list"]],
  retries: 2,
  testDir: "./e2e/screen-reader",
  timeout: 5 * 60 * 1000,
  use: {
    baseURL: "http://localhost:8787",
    headless: false,
    trace: "on-first-retry",
  },
});
