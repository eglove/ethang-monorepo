import reactConfig from "@ethang/eslint-config/config.react.js";
import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      "**/*.d.ts",
      "public",
      "src/routeTree.gen.ts",
      "wrangler.jsonc",
      ".wrangler",
      "src/index.css",
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
