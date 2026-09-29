import config from "@ethang/eslint-config/config.main.js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores([
    "**/*.d.ts",
    ".sanity",
    "dist",
    "node_modules",
    "tsconfig.json",
    "cloudflare.config.ts",
    "wrangler.config.ts",
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
    rules: {}
  }
);
