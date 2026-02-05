import config from "@ethang/eslint-config/eslint.config.js";
import { defineConfig } from "eslint/config";
// @ts-expect-error for eslint only
import path from "node:path";
import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";
import angularConfig from "@ethang/eslint-config/config.angular.js";

export default defineConfig(
	{
		ignores: ["node_modules", ".angular", "dist", "**/*.d.ts"],
	},
	...config,
	...angularConfig,
	// @ts-expect-error for eslint only
	...tailwindConfig(path.join(import.meta.dirname, "src", "styles.css")),
	{
		languageOptions: {
			parserOptions: {
				project: [
					"./tsconfig.json",
					"./tsconfig.app.json",
					"./tsconfig.spec.json"
				],
				// @ts-expect-error for eslint only
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"@angular-eslint/no-experimental": "off",
			"@typescript-eslint/no-extraneous-class": "off",
			"perfectionist/sort-objects": "off",
		},
	},
);