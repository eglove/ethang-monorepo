import config from "./src/eslint.config.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "src/README.md",
      "src/eslint.config.js",
      "src/config.solid.js",
      "src/config.react.js",
      "src/config.astro.js",
      "src/config.angular.js",
    ],
  },
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
