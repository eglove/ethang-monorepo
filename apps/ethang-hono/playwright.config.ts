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
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: [["html"], ["list"]],
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:8787",
    trace: "on-first-retry",
  },
});
