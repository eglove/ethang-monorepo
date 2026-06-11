import config from "@ethang/eslint-config/config.main.js";
import { defineConfig, globalIgnores } from "eslint/config";
import { dirname } from "path";
import { fileURLToPath } from "url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig(
  globalIgnores(["dist", "node_modules"]),
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: root
      }
    },
    rules: {
      "unicorn/import-style": "off",
      "unicorn/prefer-import-meta-properties": "off",
      "unicorn/prefer-node-protocol": "off",
      "@typescript-eslint/strict-void-return": "off"
    }
  }
);
