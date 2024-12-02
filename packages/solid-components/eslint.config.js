import config from "@ethang/eslint-config/src/eslint.config.js";
import tseslint from "typescript-eslint";
import solidConfig from "@ethang/eslint-config/src/config.solid.js"

export default tseslint.config(
    {
        ignores: [
            "**/*/dist",
            "**/*/node_modules",
            "packages/eslint-config/eslint.config.js",
            "apps/**/*.gen.ts",
            "**/*.d.ts",
            "**/.sanity",
            "**/storybook-static",
            "**/convex/_generated",
            "**/README.md"
        ],
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
            "barrel/avoid-importing-barrel-files": "off",
        }
    },
);