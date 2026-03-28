import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
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
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 15"] },
    },
  ],
  reporter: [["html"], ["list"]],
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:8787",
    trace: "on-first-retry",
  },
});
