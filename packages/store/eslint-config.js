import config from "@ethang/eslint-config/eslint.config.js";
import { defineConfig } from "vitest/config";

export default defineConfig(
  {
    ignores: [],
  },
  ...config,
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
