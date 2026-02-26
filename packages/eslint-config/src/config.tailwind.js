// @ts-nocheck
import { defineConfig, globalIgnores } from "eslint/config";
import { fixupPluginRules } from "@eslint/compat";
import { ignores, languageOptions } from "./constants.js";
import tailwind from "eslint-plugin-tailwindcss";

const config = (/** @type {string} */ pathToConfig) => {
  return defineConfig(globalIgnores(ignores), {
    files: ["**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}"],
    languageOptions,
    plugins: {
      tailwind: fixupPluginRules(tailwind),
    },
    rules: {
      "tailwind/classnames-order": "error",
      "tailwind/enforces-negative-arbitrary-values": "error",
      "tailwind/enforces-shorthand": "error",
      "tailwind/migration-from-tailwind-2": "error",
      "tailwind/no-arbitrary-value": "off",
      "tailwind/no-contradicting-classname": "error",
      "tailwind/no-custom-classname": "off",
      "tailwind/no-unnecessary-arbitrary-value": "error",
    },
    settings: { tailwindcss: { config: pathToConfig } },
  });
};

export default config;
