import tailwind from "eslint-plugin-tailwindcss";
import tseslint from "typescript-eslint";

// @ts-nocheck
import { ignores, languageOptions } from "./constants.js";

export default tseslint.config({
  files: ["**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}"],
  ignores,
  languageOptions,
  plugins: {
    tailwind,
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
});
