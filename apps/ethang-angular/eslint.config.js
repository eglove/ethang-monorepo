import config from "@ethang/eslint-config/dist/eslint.config.js";
import tseslint from "typescript-eslint";
import angularConfig from '@ethang/eslint-config/dist/config.angular.js';

export default tseslint.config(
  {
    ignores: [],
  },
  ...config,
  ...angularConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Override rules from above configs
    },
  },
);
