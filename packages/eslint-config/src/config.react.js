// @ts-nocheck
import { ignores, languageOptions } from "./constants.js";
import react from "@eslint-react/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config({
  files: ["**/*.{jsx,tsx}"],
  ignores,
  languageOptions,
  settings: {
    react: { version: "19.1.1" },
  },
  plugins: {
    react: react,
    "react-hooks": reactHooks,
  },
  rules: {
    "react/avoid-shorthand-boolean": "off",
    "react/avoid-shorthand-fragment": "off",
    "react/debug/class-component": "off",
    "react/debug/function-component": "off",
    "react/debug/hook": "off",
    "react/debug/is-from-react": "off",
    "react/debug/jsx": "off",
    "react/debug/react-hooks": "off",
    "react/dom/no-children-in-void-dom-elements": "error",
    "react/dom/no-dangerously-set-innerhtml": "error",
    "react/dom/no-dangerously-set-innerhtml-with-children": "error",
    "react/dom/no-find-dom-node": "error",
    "react/dom/no-flush-sync": "error",
    "react/dom/no-hydrate": "error",
    "react/dom/no-missing-button-type": "error",
    "react/dom/no-missing-iframe-sandbox": "error",
    "react/dom/no-namespace": "error",
    "react/dom/no-render": "error",
    "react/dom/no-render-return-value": "error",
    "react/dom/no-script-url": "error",
    "react/dom/no-unknown-property": "error",
    "react/dom/no-unsafe-iframe-sandbox": "error",
    "react/dom/no-unsafe-target-blank": "error",
    "react/dom/no-use-form-state": "error",
    "react/dom/no-void-elements-with-children": "error",
    "react/ensure-forward-ref-using-ref": "error",
    "react/hooks-extra/ensure-custom-hooks-using-other-hooks": "error",
    "react/hooks-extra/ensure-use-callback-has-non-empty-deps": "error",
    "react/hooks-extra/ensure-use-memo-has-non-empty-deps": "error",
    "react/hooks-extra/no-direct-set-state-in-use-effect": "error",
    "react/hooks-extra/no-direct-set-state-in-use-layout-effect": "error",
    "react/hooks-extra/no-redundant-custom-hook": "error",
    "react/hooks-extra/no-unnecessary-use-callback": "error",
    "react/hooks-extra/no-unnecessary-use-memo": "error",
    "react/hooks-extra/no-unnecessary-use-prefix": "error",
    "react/hooks-extra/no-useless-custom-hooks": "error",
    "react/hooks-extra/prefer-use-state-lazy-initialization": "error",
    "react/jsx-key-before-spread": "error",
    "react/jsx-no-duplicate-props": "error",
    "react/jsx-no-iife": "error",
    "react/jsx-no-undef": "error",
    "react/jsx-uses-react": "error",
    "react/jsx-uses-vars": "error",
    "react/naming-convention/component-name": "error",
    "react/naming-convention/context-name": "error",
    "react/naming-convention/filename": ["error", { rule: "kebab-case" }],
    "react/naming-convention/filename-extension": "error",
    "react/naming-convention/use-state": "error",
    "react/no-access-state-in-setstate": "error",
    "react/no-array-index-key": "error",
    "react/no-children-count": "error",
    "react/no-children-for-each": "error",
    "react/no-children-map": "error",
    "react/no-children-only": "error",
    "react/no-children-prop": "error",
    "react/no-children-to-array": "error",
    "react/no-class-component": "error",
    "react/no-clone-element": "error",
    "react/no-comment-textnodes": "error",
    "react/no-complex-conditional-rendering": "error",
    "react/no-complicated-conditional-rendering": "error",
    "react/no-component-will-mount": "error",
    "react/no-component-will-receive-props": "error",
    "react/no-component-will-update": "error",
    "react/no-context-provider": "error",
    "react/no-create-ref": "error",
    "react/no-default-props": "error",
    "react/no-direct-mutation-state": "error",
    "react/no-duplicate-jsx-props": "error",
    "react/no-duplicate-key": "error",
    "react/no-forward-ref": "error",
    "react/no-implicit-key": "error",
    "react/no-leaked-conditional-rendering": "error",
    "react/no-missing-component-display-name": "error",
    "react/no-missing-context-display-name": "error",
    "react/no-missing-key": "error",
    "react/no-misused-capture-owner-stack": "error",
    "react/no-nested-component-definitions": "error",
    "react/no-nested-components": "error",
    "react/no-nested-lazy-component-declarations": "error",
    "react/no-prop-types": "error",
    "react/no-redundant-should-component-update": "error",
    "react/no-set-state-in-component-did-mount": "error",
    "react/no-set-state-in-component-did-update": "error",
    "react/no-set-state-in-component-will-update": "error",
    "react/no-string-refs": "error",
    "react/no-unsafe-component-will-mount": "error",
    "react/no-unsafe-component-will-receive-props": "error",
    "react/no-unsafe-component-will-update": "error",
    "react/no-unstable-context-value": "error",
    "react/no-unstable-default-props": "error",
    "react/no-unused-class-component-members": "error",
    "react/no-unused-state": "error",
    "react/no-use-context": "error",
    "react/no-useless-forward-ref": "error",
    "react/no-useless-fragment": "error",
    "react/prefer-destructuring-assignment": "error",
    "react/prefer-react-namespace-import": "error",
    "react/prefer-read-only-props": "error",
    "react/prefer-shorthand-boolean": "error",
    "react/prefer-shorthand-fragment": "error",
    "react/use-jsx-vars": "error",
    "react/web-api/no-leaked-event-listener": "error",
    "react/web-api/no-leaked-interval": "error",
    "react/web-api/no-leaked-resize-observer": "error",
    "react/web-api/no-leaked-timeout": "error",
    "react-hooks/exhaustive-deps": "error",
    "react-hooks/rules-of-hooks": "error",
  },
});
