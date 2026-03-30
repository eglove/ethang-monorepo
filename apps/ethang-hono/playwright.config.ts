import { defineConfig, devices } from "@playwright/test";
import map from "lodash/map.js";

const DESKTOP_BROWSERS = [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "webkit", use: { ...devices["Desktop Safari"] } },
] as const;

const MOBILE_BROWSERS = [
  { name: "Mobile Chrome", use: { ...devices["Pixel 7"] } },
  { name: "Mobile Safari", use: { ...devices["iPhone 15"] } },
] as const;

export default defineConfig({
  fullyParallel: true,
  projects: [
    ...map(DESKTOP_BROWSERS, (b) => ({
      ...b,
      grepInvert: /@mobile/u,
      name: `mouse-${b.name}`,
      testMatch: "**/mouse/**/*.spec.ts",
    })),
    ...map(MOBILE_BROWSERS, (b) => ({
      ...b,
      grepInvert: /@desktop/u,
      name: `mouse-${b.name}`,
      testMatch: "**/mouse/**/*.spec.ts",
    })),
    ...map(DESKTOP_BROWSERS, (b) => ({
      ...b,
      grepInvert: /@mobile/u,
      name: `keyboard-${b.name}`,
      testMatch: "**/keyboard/**/*.spec.ts",
    })),
    ...map(MOBILE_BROWSERS, (b) => ({
      ...b,
      grepInvert: /@desktop/u,
      name: `keyboard-${b.name}`,
      testMatch: "**/keyboard/**/*.spec.ts",
    })),
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
