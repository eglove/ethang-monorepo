import config from "@ethang/eslint-config/config.main.js";
import reactConfig from "@ethang/eslint-config/config.react.js";
import vitestConfig from "@ethang/eslint-config/config.vitest.js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores(["dist", "node_modules"]),
  ...config,
  ...reactConfig,
  ...vitestConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "unicorn/import-style": "off",
      "unicorn/prefer-import-meta-properties": "off"
    }
  }
);
