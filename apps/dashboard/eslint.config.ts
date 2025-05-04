import solidConfig from "@ethang/eslint-config/config.solid.js";
import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["node_modules", "src/routeTree.gen.ts"], // Ignored files apply to all following configs
  },
  ...config,
  ...solidConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Override rules from above configs
    },
  },
);
