import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";
import get from "lodash/get.js";

export default tseslint.config(
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
