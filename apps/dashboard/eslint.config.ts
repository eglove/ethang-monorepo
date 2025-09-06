import reactConfig from "@ethang/eslint-config/config.react.js";
import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";
import config from "@ethang/eslint-config/eslint.config.js";
import { defineConfig } from "eslint/config";
import path from "node:path";

export default defineConfig(
  {
    ignores: [
      ".wrangler",
      "node_modules",
      "dist",
      "**/*.d.ts",
      "./src/routeTree.gen.ts",
      "./generated",
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
    rules: {
      "sonar/no-reference-error": "off",
    },
  },
);
