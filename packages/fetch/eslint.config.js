import config from "@ethang/eslint-config/config.main.js";
import { defineConfig } from "eslint/config";
import get from "lodash/get.js";

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
