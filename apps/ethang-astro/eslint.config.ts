import astroConfig from "@ethang/eslint-config/config.astro.js";
import config from "@ethang/eslint-config/config.main.js";
import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";
import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";

export default defineConfig(
  globalIgnores(["node_modules", ".wrangler", "dist", "**/*.d.ts", ".astro"]),
  ...config,
  ...astroConfig,
  ...tailwindConfig(
    path.join(import.meta.dirname, "src", "styles", "global.css")
  ),
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "css/no-invalid-properties": "off"
    }
  }
);
