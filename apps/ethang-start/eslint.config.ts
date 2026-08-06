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
    "worker-configuration.d.ts",
    "src/themes/nightowl.css",
    "src/themes/nightowl.js",
    "src/themes/nightowl.d.ts"
  ]),
  ...config,
  ...reactConfig,
  ...htmlConfig,
  ...tailwindConfig(path.join(import.meta.dirname, "src", "style.css")),
  {
    files: ["src/style.css"],
    rules: {
      // style.css legitimately references theme tokens (var(--color-*)) that
      // are defined in the imported nightowl.css, which @eslint/css cannot
      // resolve across @import boundaries. False positive — disable here.
      "css/no-invalid-properties": "off"
    }
  },
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
