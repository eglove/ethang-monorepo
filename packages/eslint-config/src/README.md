# Relentless. Unapologetic.

[View Config](https://eslint-config-ethang.pages.dev/rules)

> [!CAUTION]
> Prettier is already included for styling!

- 777 errored rules.
- 240 rules from [eslint-plugin-sonarjs](https://github.com/SonarSource/SonarJS/blob/master/packages/jsts/src/rules/README.md)
- 143 rules from [@eslint/js](https://github.com/eslint/eslint/tree/main/packages/js)
- 123 rules from [sindresorhus/eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn)
- 107 rules from [@typescript/eslint](https://github.com/typescript-eslint/typescript-eslint)
- 49 rules from [@html-eslint/eslint-plugin](https://github.com/html-eslint/html-eslint)
- 34 rules from [jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
- 32 rules from [eslint-plugin-lodash](https://github.com/wix-incubator/eslint-plugin-lodash)
- 20 rules from [eslint-plugin-perfectionist](https://github.com/azat-io/eslint-plugin-perfectionist)
- 7 rules from [@eslint/css](https://github.com/eslint/css)
- 7 rules from [@eslint/markdown](https://github.com/eslint/markdown)
- 6 rules from [@tanstack/eslint-plugin-query](https://tanstack.com/query/latest/docs/eslint/eslint-plugin-query)
- 6 rules from [@eslint/json](https://github.com/eslint/json)
- 1 rule from [eslint-plugin-compat](https://github.com/amilajack/eslint-plugin-compat)
- 1 rule from [@tanstack/eslint-plugin-router](https://tanstack.com/router/latest/docs/eslint/eslint-plugin-router)
- 1 rule from [@cspell/eslint-plugin](https://github.com/streetsidesoftware/cspell/tree/main/packages/cspell-eslint-plugin)

# Add Even More!

- 69 rules for **Angular**
  - `import angularConfig from "@ethang/eslint-config/config.angular.js";`
    - 40 rules from [@angular-eslint/eslint-plugin](https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/README.md)
    - 29 rules from [@angular-eslint/eslint-plugin-template](https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/README.md)
- 52 rules for **Astro**
  - `import astroConfig from "@ethang/eslint-config/config.astro.js";`
    - 52 rules from [eslint-plugin-astro](https://github.com/ota-meshi/eslint-plugin-astro)
- 100 rules for **React**
  - `import reactConfig from "@ethang/eslint-config/config.react.js";`
    - 97 rules from [@eslint-react/eslint-plugin](https://eslint-react.xyz/)
    - 2 rules from [eslint-plugin-react-hooks](https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks)
    - 1 rules from [react-you-might-not-need-an-effect](https://github.com/NickvanDyke/eslint-plugin-react-you-might-not-need-an-effect)
- 18 rules for **Solid**
  - `import solidConfig from "@ethang/eslint-config/config.solid.js";`
    - 18 rules from [eslint-plugin-solid](https://github.com/solidjs-community/eslint-plugin-solid)
- 15 rules from **Storybook**
  - `import storybookConfig from "@ethang/eslint-config/config.storybook.js";`
    - 15 rules from [eslint-plugin-storybook](https://github.com/storybookjs/eslint-plugin-storybook)

# Install

`pnpm i -D eslint typescript-eslint @ethang/eslint-config`

**Requires TypesScript and tsconfig.json at root directory.**

# Config

In **eslint.config.ts**

```js
import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";
import astroConfig from "@ethang/eslint-config/config.astro.js"; // OPTIONAL
import reactConfig from "@ethang/eslint-config/config.react.js"; // OPTIONAL

export default tseslint.config(
  {
    ignores: [], // Ignored files apply to all following configs
  },
  ...config,
  ...astroConfig,
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
```

**Scripts**

```json
"scripts": {
  "lint": "eslint . --fix"
}
```

**Browserslist**

This config will also lint for browserslist features. Make sure to set this in package.json. [More info.](https://github.com/browserslist/browserslist)

```json
"browserslist": [
  "defaults and fully supports es6-module",
  "maintained node versions"
],
```

**Engines**

```json
"engines": {
  "node": ">=22"
},
```
