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
  {
    // The shared eslint-plugin-prettier/recommended config activates prettier/prettier
    // globally, but it doesn't carry a parser mapping for Markdown, so it reports a
    // bogus "Parsing error: Unexpected token" at 1:1 on valid .md files. Disable the
    // rule for .md only — prettier is still run as a pre-commit formatter if needed.
    files: ["**/*.md"],
    rules: {
      "prettier/prettier": "off",
    },
  },
);
