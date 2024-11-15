import config from "@ethang/eslint-config/src/eslint.config.js";
import tseslint from "typescript-eslint";
import reactConfig from "@ethang/eslint-config/src/config.react.js";

export default tseslint.config(
    {
        ignores: [
            "**/*/dist",
            "**/*/node_modules",
            "packages/eslint-config/eslint.config.js",
            "apps/**/*.gen.ts"
        ],
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
            "barrel/avoid-importing-barrel-files": "off",
            "sonar/no-os-command-from-path": "off",
            "sonar/os-command": "off",
        },
    },
);