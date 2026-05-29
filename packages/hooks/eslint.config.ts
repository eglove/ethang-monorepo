import config from "@ethang/eslint-config/config.main.js";
import { defineConfig, globalIgnores } from "eslint/config";
import get from "lodash/get";

const root = get(import.meta, ["dirname"]);

export default defineConfig(
  globalIgnores(["dist", "node_modules"]),
  ...config,
  {
    languageOptions: {
      parserOptions: {
        // Point explicitly to your local config or true,
        // but bound it strictly to this directory
        project: ["./tsconfig.json"],
        tsconfigRootDir: root
      }
    },
    rules: {}
  }
);
