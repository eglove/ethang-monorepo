import reactConfig from "@ethang/eslint-config/config.react.js";
import storybookConfig from "@ethang/eslint-config/config.storybook.js";
import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [], // Ignored files apply to all following configs
  },
  ...config,
  ...reactConfig,
  ...storybookConfig,
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
