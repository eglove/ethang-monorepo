import htmlConfig from "@ethang/eslint-config/config.html.js";
import config from "@ethang/eslint-config/config.main.js";
import reactConfig from "@ethang/eslint-config/config.react.js";
import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";
import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";

export default defineConfig(
  globalIgnores([
    "node_modules",
    ".wrangler",
    "dist",
    "coverage",
    "**/*.d.ts",
    "src/routeTree.gen.ts"
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
      "css/use-layers": "off"
    }
  }
);
