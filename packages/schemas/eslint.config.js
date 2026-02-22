import config from "@ethang/eslint-config/config.main.js";
import { defineConfig } from "eslint/config";

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
