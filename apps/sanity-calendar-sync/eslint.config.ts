import config from "@ethang/eslint-config/config.main.js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores([
    "coverage",
    "node_modules",
    "dist",
    ".wrangler",
    ".cloudflare",
    "cloudflare.config.ts",
    "wrangler.config.ts",
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
