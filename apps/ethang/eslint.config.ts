import reactConfig from "@ethang/eslint-config/config.react.js";
import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";
import config from "@ethang/eslint-config/eslint.config.js";
import path from "node:path";
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
      "public",
      "src/index.css",
    ],
  },
  ...config,
  ...reactConfig,
  ...tailwindConfig(path.join(import.meta.dirname, "src", "index.css")),
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
