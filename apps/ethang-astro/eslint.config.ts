import astroConfig from "@ethang/eslint-config/config.astro.js";
import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [".astro", ".wrangler", "dist", "node_modules", "**/*.d.ts"],
  },
  ...config,
  ...astroConfig,
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
