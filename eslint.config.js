import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";
import reactConfig from "@ethang/eslint-config/config.react.js";

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
    ...reactConfig,
    {
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        "files": ["packages/react-components/components/ui"],
        "rules": {"react/prefer-read-only-props": "off"}
    }
);