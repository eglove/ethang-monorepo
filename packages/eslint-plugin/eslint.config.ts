import config from "@ethang/eslint-config/config.main.js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores([
    "src/rules/fixture.fixture.ts",
    "tsconfig.json",
    "coverage",
    "dist",
    "**/*.d.ts",
    "README.md"
  ]),
  ...config,
  {
    files: ["src/utils/lodash-api.ts"],
    rules: {
      "sonar/max-lines": "off",
      "sonar/no-duplicate-string": "off"
    }
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "no-continue": "off"
    }
  },
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "@ethang/prefer-effect": "off",
      "@ethang/prefer-lodash": "off",
      "sonar/function-name": "off"
    }
  }
);
