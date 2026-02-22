import config from "@ethang/eslint-config/config.main.js";
import { defineConfig, globalIgnores } from "eslint/config";
import get from "lodash/get.js";

export default defineConfig(
  globalIgnores(["node_modules", "dist"]),
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
