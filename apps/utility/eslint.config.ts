import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules",
      ".wrangler",
      "public",
      "tests/you-might-not-need-lodash.ts",
    ],
  },
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Override rules from above configs
    },
  },
);
