import htmlConfig from "@ethang/eslint-config/config.html.js"; // OPTIONAL
import config from "@ethang/eslint-config/config.main.js";
import reactConfig from "@ethang/eslint-config/config.react.js"; // OPTIONAL
import tailwindConfig from "@ethang/eslint-config/config.tailwind.js"; // OPTIONAL
import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";

export default defineConfig(
  globalIgnores([
    "node_modules",
    ".tanstack",
    "src/routeTree.gen.ts",
    "vite.config.ts",
    "tsconfig.json",
    "worker-configuration.d.ts"
  ]),
  ...config,
  ...reactConfig,
  ...htmlConfig,
  ...tailwindConfig(path.join(import.meta.dirname, "src", "style.css")),
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      // Override rules from above configs
    }
  }
);
