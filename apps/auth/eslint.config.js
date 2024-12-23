import config from "@ethang/eslint-config/dist/eslint.config.js";
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
            "sonar/no-reference-error": "off",
        },
    },
);