import { defineConfig, devices } from "@playwright/test";
import map from "lodash/map.js";

const DESKTOP_MOBILE_BROWSERS = [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "webkit", use: { ...devices["Desktop Safari"] } },
  { name: "Mobile Chrome", use: { ...devices["Pixel 7"] } },
  { name: "Mobile Safari", use: { ...devices["iPhone 15"] } },
] as const;

export default defineConfig({
  fullyParallel: true,
  projects: [
    ...map(DESKTOP_MOBILE_BROWSERS, (b) => ({
      ...b,
      name: `mouse-${b.name}`,
      testMatch: "**/mouse/**/*.spec.ts",
    })),
    ...map(DESKTOP_MOBILE_BROWSERS, (b) => ({
      ...b,
      name: `keyboard-${b.name}`,
      testMatch: "**/keyboard/**/*.spec.ts",
    })),
    {
      name: "broken-links",
      testMatch: "**/broken-links.spec.ts",
      // The broken-links test crawls hundreds of external URLs; each carries
      // a 10 s per-link timeout so the total can well exceed 5 minutes.
      timeout: 5 * 60 * 1000,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: [["html"], ["list"]],
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:8787",
    // Block the service worker so Playwright route handlers can intercept
    // all fetch requests — including non-GET requests (e.g. PUT) that the SW
    // would otherwise proxy through its own fetch(), bypassing page.route().
    serviceWorkers: "block",
    trace: "on-first-retry",
  },
});
