import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".wrangler",
      "node_modules",
      "**/*.d.ts",
      "generated",
      "wrangler.jsonc",
      "tsconfig.json",
    ],
  },
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        // @ts-expect-error import meta
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {},
  },
);
