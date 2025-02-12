import config from "@ethang/eslint-config/src/eslint.config.js";
import tseslint from "typescript-eslint";
import reactConfig from "@ethang/eslint-config/src/config.react.js";

export default tseslint.config(
  {
    ignores: [
      "src/routeTree.gen.ts",
      "src/vite-env.d.ts",
      "src/components/ui/chart.tsx",
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
    rules: {},
  },
);
