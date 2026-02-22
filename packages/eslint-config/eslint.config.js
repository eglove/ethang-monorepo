import config from "./src/eslint.config.js";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    ignores: [
      "dist",
      "coverage",
      "src/README.md",
      "src/eslint.config.js",
      "src/config.solid.js",
      "src/config.react.js",
      "src/config.astro.js",
      "src/config.angular.js",
      "src/config.storybook.js",
      "src/config.tailwind.js",
      "**/*.d.ts",
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
  },
);
