// @ts-nocheck
import { defineConfig } from "eslint/config";
import { ignores, languageOptions } from "./constants.js";
import tailwind from "eslint-plugin-tailwindcss";

const config = (/** @type {string} */ pathToConfig) => {
  return defineConfig({
    files: ["**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}"],
    ignores,
    languageOptions,
    plugins: {
      tailwind: tailwind,
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
