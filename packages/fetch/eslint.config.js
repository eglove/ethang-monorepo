import config from "@ethang/eslint-config/eslint.config.js";
import get from "lodash/get.js";
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
        tsconfigRootDir: get(import.meta, ["dirname"]),
      },
    },
    rules: {},
  },
);
