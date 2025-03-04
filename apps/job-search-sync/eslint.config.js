import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";
import reactConfig from "@ethang/eslint-config/config.react.js";

export default tseslint.config(
  {
    ignores: [
      "vitest.config.mts",
      "**/*.d.ts",
      "src/local-seed/data-backup.ts",
    ],
  },
  ...config,
  ...reactConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "sonar/no-reference-error": "off",
    },
  },
);
