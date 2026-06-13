import config from "@ethang/eslint-config/config.main.js";
import vitestConfig from "@ethang/eslint-config/config.vitest.js";
import { defineConfig } from "eslint/config";

export default defineConfig(...config, ...vitestConfig, {
  languageOptions: {
    parserOptions: {
      project: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {},
});
