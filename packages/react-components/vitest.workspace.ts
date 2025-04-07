/* eslint-disable unicorn/prefer-module */
import { storybookTest } from "@storybook/experimental-addon-test/vitest-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineWorkspace } from "vitest/config";

const dirname =
  "undefined" === typeof __dirname
    ? path.dirname(fileURLToPath(import.meta.url))
    : __dirname;

// More info at: https://storybook.js.org/docs/writing-tests/test-addon
export default defineWorkspace([
  "vite.config.ts",
  {
    extends: "vite.config.ts",
    plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/writing-tests/test-addon#storybooktest
      storybookTest({ configDir: path.join(dirname, ".storybook") }),
    ],
    test: {
      browser: {
        enabled: true,
        headless: true,
        name: "chromium",
        provider: "playwright",
      },
      name: "storybook",
      setupFiles: [".storybook/vitest.setup.ts"],
    },
  },
]);
