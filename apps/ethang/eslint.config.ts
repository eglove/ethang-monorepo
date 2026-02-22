import htmlConfig from "@ethang/eslint-config/config.html.js";
import config from "@ethang/eslint-config/config.main.js";
import reactConfig from "@ethang/eslint-config/config.react.js";
import storybookConfig from "@ethang/eslint-config/config.storybook.js";
import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";
import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";

export default defineConfig(
  globalIgnores([
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
    "coverage",
    "src/components/todo/todo.puml",
  ]),
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
