import { defineConfig, devices } from "@playwright/test";
import isNil from "lodash/isNil.js";

export default defineConfig({
  forbidOnly: !isNil(process.env["CI"]),
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  reporter: [["html", { open: "never" }]],
  retries: isNil(process.env["CI"]) ? 0 : 2,
  testDir: "./tests",
  use: {
    baseURL: "http://localhost:3000"
  },
  webServer: {
    command: "vite dev --port 3000",
    port: 3000,
    reuseExistingServer: isNil(process.env["CI"])
  },
  workers: isNil(process.env["CI"]) ? 2 : 1
});
