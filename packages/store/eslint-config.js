import config from "@ethang/eslint-config/config.main.js";
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
