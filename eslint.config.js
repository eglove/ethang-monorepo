import config from "@ethang/eslint-config/src/eslint.config.js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "**/*/dist",
            "**/*/node_modules",
        ],
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
            "barrel/avoid-importing-barrel-files": "off",
            "sonar/no-os-command-from-path": "off",
            "sonar/os-command": "off",
        },
    },
);