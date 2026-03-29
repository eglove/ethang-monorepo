import htmlConfig from "@ethang/eslint-config/config.html.js";
import config from "@ethang/eslint-config/config.main.js";
import playwrightConfig from "@ethang/eslint-config/config.playwright.js";
import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";
import vitestConfig from "@ethang/eslint-config/config.vitest.js";
import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";

export default defineConfig(
  globalIgnores([
    "node_modules",
    "**/*.d.ts",
    "dist",
    ".wrangler",
    "wrangler.jsonc",
    "src/index.css",
    "public",
    "migrations",
    "coverage",
    "docs",
    "playwright-report",
    "test-results",
  ]),
  ...config,
  ...htmlConfig,
  ...tailwindConfig(path.join(import.meta.dirname, "src", "index.css")),
  ...vitestConfig,
  ...playwrightConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {},
  },
);
