import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/*/dist",
      "**/*/node_modules",
      "packages/eslint-config/eslint.config.js",
      "apps/**/*.gen.ts",
      "**/*.d.ts",
      "**/.sanity",
      "**/storybook-static",
      "**/convex/_generated",
      "**/README.md",
    ],
  },
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
