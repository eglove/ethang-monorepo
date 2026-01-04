import htmlConfig from "@ethang/eslint-config/config.html.js";
import reactConfig from "@ethang/eslint-config/config.react.js";
import storybookConfig from "@ethang/eslint-config/config.storybook.js";
import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";
import config from "@ethang/eslint-config/eslint.config.js";
import { defineConfig } from "eslint/config";
import path from "node:path";

export default defineConfig(
  {
    ignores: [
      "**/*.d.ts",
      "node_modules",
      "dist",
      ".wrangler",
      "tsconfig.json",
      ".tanstack",
      "src/routeTree.gen.ts",
      "generated",
      "wrangler.jsonc",
      "src/index.css",
      "storybook-static",
    ],
  },
  ...config,
  ...htmlConfig,
  ...reactConfig,
  ...storybookConfig,
  ...tailwindConfig(path.join(import.meta.dirname, "src", "index.css")),
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
