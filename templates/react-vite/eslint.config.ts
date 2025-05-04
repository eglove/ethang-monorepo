import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";
import reactConfig from "@ethang/eslint-config/config.react.js";

export default tseslint.config(
    {
        ignores: ["node_modules", "**/*.d.ts", "**/*.config.ts"],
    },
    ...config,
    ...reactConfig,
    {
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // Override rules from above configs
        },
    },
);