import reactConfig from "@ethang/eslint-config/config.react.js";
import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
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
    ],
  },
  ...config,
  ...reactConfig,
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
