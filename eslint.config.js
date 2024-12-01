import config from "@ethang/eslint-config/src/eslint.config.js";
import tseslint from "typescript-eslint";
import reactConfig from "@ethang/eslint-config/src/config.react.js";

export default tseslint.config(
    {
        ignores: [
            "**/*/dist",
            "**/*/node_modules",
            "packages/eslint-config/eslint.config.js",
            'apps/ethang-tanstack/src/components/ui/sidebar.tsx', // TODO move UI components to lib
            "apps/**/*.gen.ts",
            "**/*.d.ts",
            "**/.sanity",
            "**/storybook-static",
            "**/convex/_generated",
            "**/README.md"
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
            "no-console": "off",
            "react/no-children-prop": "off",
            "sonar/no-os-command-from-path": "off",
            "sonar/os-command": "off",
            "sonar/no-unstable-nested-components": "off",
        },
    },
);