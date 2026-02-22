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
  ]),
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        // @ts-expect-error import meta
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {},
  },
);
