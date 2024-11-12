import config from "@ethang/eslint-config/src/eslint.config.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["**/*/dist", "**/*/node_modules", "packages/src/**/*.js"],
    },
    ...config,
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