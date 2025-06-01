import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import path from "node:path";
import { defineWorkspace } from "vitest/config";

const dirname =
  // eslint-disable-next-line unicorn/prefer-module
  "undefined" === typeof __dirname ? import.meta.dirname : __dirname;

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineWorkspace([
  "vite.config.ts",
  {
    extends: "vite.config.ts",
    plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({ configDir: path.join(dirname, ".storybook") }),
    ],
    test: {
      browser: {
        enabled: true,
        headless: true,
        instances: [{ browser: "chromium" }],
        provider: "playwright",
      },
      name: "storybook",
      setupFiles: [".storybook/vitest.setup.ts"],
    },
  },
]);
