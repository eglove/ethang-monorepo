import config from "@ethang/eslint-config/config.main.js";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores(["node_modules", "__generated__"]),
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "unicorn/prevent-abbreviations": "off"
    }
  }
);
