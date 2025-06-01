import reactConfig from "@ethang/eslint-config/config.react.js"; // OPTIONAL
import storybookConfig from "@ethang/eslint-config/config.storybook.js";
import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".wrangler",
      "node_modules",
      "dist",
      "**/*.d.ts",
      "./src/routeTree.gen.ts",
      "./generated",
    ],
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
      "sonar/no-reference-error": "off",
    },
  },
);
