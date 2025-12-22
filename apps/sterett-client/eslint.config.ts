import htmlConfig from "@ethang/eslint-config/config.html.js";
import reactConfig from "@ethang/eslint-config/config.react.js";
import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";
import config from "@ethang/eslint-config/eslint.config.js";
import { defineConfig } from "eslint/config";
import path from "node:path";

export default defineConfig(
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
  ...htmlConfig,
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
