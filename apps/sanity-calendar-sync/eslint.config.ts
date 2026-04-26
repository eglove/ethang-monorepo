import config from "@ethang/eslint-config/config.main.js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores([
    "node_modules",
    "dist",
    ".wrangler",
    "wrangler.jsonc",
    "**/*.d.ts"
  ]),
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {}
  }
);
