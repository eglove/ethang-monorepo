import htmlConfig from "@ethang/eslint-config/config.html.js";
import reactConfig from "@ethang/eslint-config/config.react.js";
import config from "@ethang/eslint-config/eslint.config.js";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: [
      "node_modules",
      "**/*.d.ts",
      "dist",
      ".wrangler",
      "tsconfig.json",
      "wrangler.jsonc",
    ],
  },
  ...config,
  ...reactConfig,
  ...htmlConfig,
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
