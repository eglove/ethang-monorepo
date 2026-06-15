import config from "@ethang/eslint-config/config.main.js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores([
    ".wrangler",
    "node_modules",
    "**/*.d.ts",
    "generated",
    "wrangler.jsonc",
    "tsconfig.json",
    "migrations",
    "coverage"
  ]),
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "unicorn/no-top-level-side-effects": "off"
    }
  }
);
