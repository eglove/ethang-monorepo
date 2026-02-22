import htmlConfig from "@ethang/eslint-config/config.html.js";
import config from "@ethang/eslint-config/config.main.js";
import reactConfig from "@ethang/eslint-config/config.react.js";
import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";
import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";

export default defineConfig(
  globalIgnores([
    "dist",
    "node_modules",
    "**/*.d.ts",
    "public",
    "src/routeTree.gen.ts",
    "wrangler.jsonc",
    ".wrangler",
    "src/index.css",
  ]),
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
