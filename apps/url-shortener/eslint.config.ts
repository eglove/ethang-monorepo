import config from "@ethang/eslint-config/config.main.js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores([
    ".wrangler",
    "node_modules",
    "**/*.d.ts",
    "wrangler.jsonc",
    "tsconfig.json",
    "coverage",
  ]),
  ...config,
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
