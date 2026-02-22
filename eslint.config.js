import config from "@ethang/eslint-config/config.main.js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores([
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
  ]),
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
