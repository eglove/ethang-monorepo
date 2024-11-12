import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";

export default tseslint.config(...config, {
    languageOptions: {
        parserOptions: {
            project: true,
            tsconfigRootDir: import.meta.dirname,
        },
    },
});