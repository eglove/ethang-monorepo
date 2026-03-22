import { defineConfig, devices } from "@playwright/test";
import isNil from "lodash/isNil.js";

// @ts-expect-error it's fine
export default defineConfig({
  forbidOnly: Boolean(process.env["CI"]),
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
    {
      name: "Microsoft Edge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
    },
    {
      name: "Google Chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  reporter: [["html", { open: "never" }]],
  retries: isNil(process.env["CI"]) ? 0 : 2,
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  use: {
    baseURL: "http://localhost:8787",
  },
  workers: isNil(process.env["CI"]) ? undefined : 1,
});
