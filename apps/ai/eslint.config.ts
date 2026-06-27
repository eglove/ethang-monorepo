import config from "@ethang/eslint-config/config.main.js";
import reactConfig from "@ethang/eslint-config/config.react.js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores(["node_modules", "dist", "coverage"]),
  ...config,
  ...reactConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {}
  }
);
