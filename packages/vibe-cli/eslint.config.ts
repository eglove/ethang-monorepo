import config from "@ethang/eslint-config/config.main.js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores([
    "node_modules",
    ".remember",
    "tests/traces/fixtures",
    "docs",
    "backlog",
    "agents",
    "README.md",
    "coverage",
  ]),
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,
      },
      sourceType: "module",
    },
    rules: {
      "sonar/declarations-in-global-scope": "off",
      "unicorn/no-process-exit": "off",
    },
  },
);
