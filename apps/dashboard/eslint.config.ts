import config from "@ethang/eslint-config/eslint.config.js";
import { defineConfig } from "eslint/config";
import path from "node:path";
import reactConfig from "@ethang/eslint-config/config.react.js";
import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";

export default defineConfig(
	{
		ignores: ["node_modules", "**/*.d.ts", "dist", ".wrangler"],
	},
	...config,
	...reactConfig,
	...tailwindConfig(path.join(import.meta.dirname, "src", "index.css")),
	{
		languageOptions: {
			parserOptions: {
				project: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
		},
	},
);