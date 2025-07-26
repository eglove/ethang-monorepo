# Relentless. Unapologetic.

[View Config](https://eslint-config-ethang.pages.dev/rules)

> [!CAUTION]
> Prettier is already included for styling!

- 792 errored rules.
- 237 rules from [eslint-plugin-sonarjs](https://github.com/SonarSource/SonarJS/blob/master/packages/jsts/src/rules/README.md)
- 143 rules from [@eslint/js](https://github.com/eslint/eslint/tree/main/packages/js)
- 127 rules from [sindresorhus/eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn)
- 107 rules from [@typescript/eslint](https://github.com/typescript-eslint/typescript-eslint)
- 48 rules from [@html-eslint/eslint-plugin](https://github.com/html-eslint/html-eslint)
- 34 rules from [jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
- 32 rules from [eslint-plugin-lodash](https://github.com/wix-incubator/eslint-plugin-lodash)
- 20 rules from [eslint-plugin-perfectionist](https://github.com/azat-io/eslint-plugin-perfectionist)
- 18 rules from [@eslint/markdown](https://github.com/eslint/markdown)
- 10 rules from [@eslint/css](https://github.com/eslint/css)
- 7 rules from [@tanstack/eslint-plugin-query](https://tanstack.com/query/latest/docs/eslint/eslint-plugin-query)
- 6 rules from [@eslint/json](https://github.com/eslint/json)
- 1 rule from [eslint-plugin-compat](https://github.com/amilajack/eslint-plugin-compat)
- 1 rule from [@tanstack/eslint-plugin-router](https://tanstack.com/router/latest/docs/eslint/eslint-plugin-router)
- 1 rule from [@cspell/eslint-plugin](https://github.com/streetsidesoftware/cspell/tree/main/packages/cspell-eslint-plugin)

# Add Even More!

- 76 rules for **Angular**
  - `import angularConfig from "@ethang/eslint-config/config.angular.js";`
    - 45 rules from [@angular-eslint/eslint-plugin](https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/README.md)
    - 31 rules from [@angular-eslint/eslint-plugin-template](https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/README.md)
- 52 rules for **Astro**
  - `import astroConfig from "@ethang/eslint-config/config.astro.js";`
    - 52 rules from [eslint-plugin-astro](https://github.com/ota-meshi/eslint-plugin-astro)
- 100 rules for **React**
  - `import reactConfig from "@ethang/eslint-config/config.react.js";`
    - 98 rules from [@eslint-react/eslint-plugin](https://eslint-react.xyz/)
    - 2 rules from [eslint-plugin-react-hooks](https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks)
- 18 rules for **Solid**
  - `import solidConfig from "@ethang/eslint-config/config.solid.js";`
    - 18 rules from [eslint-plugin-solid](https://github.com/solidjs-community/eslint-plugin-solid)
- 16 rules for **Storybook**
  - `import storybookConfig from "@ethang/eslint-config/config.storybook.js";`
    - 16 rules from [eslint-plugin-storybook](https://github.com/storybookjs/eslint-plugin-storybook)
- 6 rules for **Tailwind**
  - import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";
    - 6 rules from [eslint-plugin-tailwindcss](https://github.com/francoismassart/eslint-plugin-tailwindcss)

# Install

```powershell
pnpm i -D eslint typescript-eslint @ethang/eslint-config
```

**Requires TypesScript and tsconfig.json at root directory.**

# Config

In **eslint.config.ts**

```js
import config from "@ethang/eslint-config/eslint.config.js";
import tseslint from "typescript-eslint";
import path from "node:path";
import reactConfig from "@ethang/eslint-config/config.react.js"; // OPTIONAL
import tailwindConfig from "@ethang/eslint-config/config.tailwind.js"; // OPTIONAL

export default tseslint.config(
  {
    ignores: [], // Ignored files apply to all following configs
  },
  ...config,
  ...reactConfig,
  ...tailwindConfig(path.join(import.meta.dirname, "src", "index.css")),
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

This config will also lint for browserslist features. [More info.](https://github.com/browserslist/browserslist)

It's recommended to use [browserslist-config-baseline](https://github.com/web-platform-dx/browserslist-config-baseline)

```powershell
pnpm i -D browserslist-config-baseline
```

```json
"browserslist": [
  "extends browserslist-config-baseline",
  "current node"
],
```

Or a simpler config without an additional dependency.

```json
"browserslist": [
  "defaults and fully supports es6-module",
  "current node"
],
```

**Engines**

```json
"engines": {
  "node": ">=22"
},
```
