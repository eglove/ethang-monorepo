import config from "@ethang/eslint-config/eslint.config.js";
import { defineConfig } from "eslint/config";

export default defineConfig(
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
      "sonar.ts",
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
