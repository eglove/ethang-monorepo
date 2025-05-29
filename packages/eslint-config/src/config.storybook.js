import storybook from "eslint-plugin-storybook";
import tseslint from "typescript-eslint";

// @ts-nocheck
import { ignores, languageOptions } from "./constants.js";

export default tseslint.config({
  files: ["**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)"],
  ignores,
  languageOptions,
  plugins: {
    storybook,
  },
  rules: {
    "storybook/await-interactions": "error",
    "storybook/context-in-play-function": "error",
    "storybook/csf-component": "error",
    "storybook/default-exports": "error",
    "storybook/hierarchy-separator": "error",
    "storybook/meta-inline-properties": "error",
    "storybook/meta-satisfies-type": "error",
    "storybook/no-redundant-story-name": "error",
    "storybook/no-renderer-packages": "error",
    "storybook/no-stories-of": "error",
    "storybook/no-title-property-in-meta": "error",
    "storybook/no-uninstalled-addons": "error",
    "storybook/prefer-pascal-case": "error",
    "storybook/story-exports": "error",
    "storybook/use-storybook-expect": "error",
    "storybook/use-storybook-testing-library": "error",
  },
});
