import reactConfig from "@ethang/eslint-config/config.react.js"; // OPTIONAL
import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".wrangler",
      "node_modules",
      "dist",
      "**/*.d.ts",
      "./src/routeTree.gen.ts",
      "./generated",
      "src/index.css",
    ],
  },
  ...config,
  ...reactConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "sonar/no-reference-error": "off",
    },
  },
);
