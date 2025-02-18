import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [], // Ignored files apply to all following configs
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
            "@typescript-eslint/no-unused-vars": "off",
            "no-new": "off",
            "sonar/constructor-for-side-effects": "off",
            "sonar/no-reference-error": "off",
            "unicorn/prefer-top-level-await": "off",
        },
    },
);