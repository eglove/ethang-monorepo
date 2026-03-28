# ESLint Config Refactor — Plugin Class Architecture

**Date:** 2026-03-28
**Status:** Approved

## Problem

Adding a new ESLint plugin currently requires touching five separate files:

1. `rule-list.ts` — registry entry with type string, import string, plugin metadata
2. `list-utilities.ts` — two switch cases (`getTypeFiles` and `getTypeLanguage`)
3. `update-rules.ts` — ConfigFile array definition + `createConfigFile` call
4. `update-readme.ts` — variable declaration, count loop, list entry
5. `build.ts` — output filename entry

The root cause is a string `type` key that links all these files together invisibly. Renaming a type (e.g. `"test"` → `"vitest"`) requires hunting down every switch case and filter call. There is no single file where you can understand a plugin in full.

## Goal

- Opening a `setup/*.ts` file tells you everything about that plugin
- Adding a plugin means creating one file and adding one import to the registry
- Moving a plugin between output groupings is a one-line change
- No switch statements, no string key dispatch

## Architecture

### Files Removed

| File | Replacement |
|---|---|
| `src/build/rule-list.ts` | Plugin instances in each `setup/*.ts` |
| `src/build/list-utilities.ts` | Logic moves into `Plugin` class |

### Files Added

| File | Purpose |
|---|---|
| `src/build/plugin.ts` | `Plugin` class definition |
| `src/build/output-config.ts` | `OutputConfig` class + full registry of all output groupings |

### Files Simplified

| File | Change |
|---|---|
| `src/build/create-config-file.ts` | Takes `OutputConfig` instead of `ConfigFile[]` + filename; absorbs `create-config.ts` |
| `src/build/create-config.ts` | Deleted — logic merged into `create-config-file.ts` (the indirection it served is gone) |
| `src/build/update-rules.ts` | Reduced to ~5 lines iterating `outputConfigs` |
| `src/build/update-readme.ts` | Iterates `outputConfigs` directly, no per-variable `getList` calls |
| `build.ts` | Derives `configFiles` from `outputConfigs.map(c => c.fileName)` |

## The `Plugin` Class

An immutable value object. One instance per ESLint plugin. Lives in the plugin's `setup/*.ts` file alongside its existing rules export.

```ts
class Plugin {
  // Identity — used in readme
  readonly name: string;               // "@vitest/eslint-plugin"
  readonly url: string;                // "https://github.com/vitest-dev/eslint-plugin-vitest"

  // Config block generation
  readonly files: string;              // "**/*.test.{ts,tsx,js,jsx,mjs,cjs}"
  readonly rules: Linter.RulesRecord;
  readonly importString?: string;      // 'import vitest from "@vitest/eslint-plugin";'
  readonly pluginName?: string;        // key in plugins: {}
  readonly pluginValue?: string;       // JS expression for the plugin value
  readonly language?: string;          // "css/css" | "html/html" | etc.
  readonly extraRules?: Record<string, string>; // e.g. { "prettier/prettier": "off" }
  readonly processor?: string;         // "angular.processInlineTemplates"
  readonly extraOptions?: string;      // "settings: { tailwindcss: { config: pathToConfig } },"
  readonly auxiliaryImport?: string;   // extra import for processor references (e.g. angular)
  readonly order?: number;             // sort position within a config block

  readonly includeReactVersion?: boolean;
  readonly includeAngularLanguageOptions?: boolean;

  get ruleCount(): number              // count of non-"off" rules
}
```

`auxiliaryImport` handles the angular edge case: the processor references `angular.processInlineTemplates`, which requires `import angular from "angular-eslint"` at the config file level beyond the plugin's own import.

### Setup File — Before and After

```ts
// BEFORE: only knows about rules
export const vitestRules = genRules(ruleNames, customRules, "vitest");

// AFTER: knows everything
export const vitestRules = genRules(ruleNames, customRules, "vitest");

export const vitestPlugin = new Plugin({
  name: "@vitest/eslint-plugin",
  url: "https://github.com/vitest-dev/eslint-plugin-vitest",
  files: "**/*.test.{ts,tsx,js,jsx,mjs,cjs}",
  rules: vitestRules,
  importString: 'import vitest from "@vitest/eslint-plugin";',
  pluginName: "vitest",
  pluginValue: "vitest",
});
```

The existing `vitestRules` export is preserved — tests and `genRules` still reference it directly.

## The `OutputConfig` Class

Defines a single output file: which plugins compose it and how they are assembled. All groupings live in one registry in `output-config.ts`.

```ts
class OutputConfig {
  readonly fileName: string;              // "config.vitest.js"
  readonly plugins: Plugin[];             // all plugins in this output

  // Output-level assembly options
  readonly includeIgnores?: boolean;      // prepend globalIgnores(ignores)
  readonly includeLanguageOptions?: boolean;
  readonly globalIgnores?: string[];      // e.g. ["**/*.spec.ts"] for angular
  readonly functionParameters?: string;   // tailwind: "/** @type {string} */ pathToConfig"

  // Readme — if readmeLabel is set, output appears in "Add Even More!" section
  readonly readmeLabel?: string;          // "Vitest"
  readonly readmeImport?: string;         // 'import vitestConfig from "@ethang/eslint-config/config.vitest.js";'

  get ruleCount(): number                 // sum of all plugin ruleCounts
}
```

### Config Block Grouping

Plugins sharing the same `files` value are merged into one config block. Plugins with different `files` each get their own block. This is automatic — no extra configuration needed.

Example: `config.main.js` contains compat, eslint, typescript, unicorn, lodash, sonar, perfectionist, tanstack-query, tanstack-router, a11y, cspell (all with `**/*.{js,ts,...}`), plus separate blocks for markdown, css, json, jsonc, json5.

Example: `config.angular.js` contains angularTs (`**/*.ts`) and angularTemplate (`**/*.html`) — two different `files` values → two config blocks automatically.

### Registry Example

```ts
// src/build/output-config.ts
export const outputConfigs: OutputConfig[] = [
  new OutputConfig({
    fileName: "config.main.js",
    plugins: [
      compatPlugin, eslintPlugin, typescriptPlugin, unicornPlugin,
      lodashPlugin, sonarPlugin, perfectionistPlugin,
      tanstackQueryPlugin, tanstackRouterPlugin, a11yPlugin, cspellPlugin,
      markdownPlugin, cssPlugin, jsonPlugin, jsoncPlugin, json5Plugin,
    ],
    includeIgnores: true,
    includeLanguageOptions: true,
  }),
  new OutputConfig({
    fileName: "config.vitest.js",
    plugins: [vitestPlugin],
    includeIgnores: true,
    includeLanguageOptions: true,
    readmeLabel: "Vitest",
    readmeImport: 'import vitestConfig from "@ethang/eslint-config/config.vitest.js";',
  }),
  // angular, astro, react, solid, storybook, html, tailwind...
];
```

Moving a plugin to a different output = remove from one `plugins` array, add to another.

## Build Pipeline Changes

### `update-rules.ts`

```ts
export const updateRules = async () => {
  await Promise.all(
    outputConfigs.map(config => createConfigFile(config))
  );
};
```

### `create-config-file.ts`

Signature changes from `createConfigFile(listConfigs: ConfigFile[], fileName: string)` to `createConfigFile(output: OutputConfig)`. Groups `output.plugins` by `files` to form config blocks. Collects `importString` and `auxiliaryImport` from each plugin directly — no `getTypeImportStrings` lookup.

### `create-config.ts`

Deleted. Its logic is absorbed into `create-config-file.ts`. The only reason it existed as a separate file was the type-string indirection — `createConfigFile` called `createConfig(type)` which called `getList(type)`. With `OutputConfig` providing plugins directly, that chain collapses into one function.

### `update-readme.ts`

```ts
const featuredOutputs = outputConfigs.filter(c => c.readmeLabel);
// for each: c.readmeLabel, c.readmeImport, c.ruleCount, c.plugins (for per-plugin lines)
```

No more per-variable `getList("vitest")` calls or manual count loops.

### `build.ts`

```ts
const configFiles = outputConfigs.map(c => `src/${c.fileName}`);
```

## Testing

### Deleted

- `src/build/list-utilities.test.ts` — functionality covered by `Plugin` unit tests
- `src/build/create-config.test.ts` — file deleted; coverage moves into `create-config-file.test.ts`

### Added

| File | What it tests |
|---|---|
| `src/build/plugin.test.ts` | `ruleCount` getter, construction with all option combinations |
| `src/build/output-config.test.ts` | `ruleCount`, plugins-by-files grouping logic |

### Updated

| File | Change |
|---|---|
| `src/build/create-config-file.test.ts` | Pass `OutputConfig` instead of `ConfigFile[]`; absorbs create-config tests |
| `src/build/update-rules.test.ts` | Call count derived from `outputConfigs.length` |

### Unchanged

`gen-rules.test.ts`, `get-react-version.test.ts`, `lodash.test.ts`, `sonar.test.ts`

## Constraints

- All existing `*Rules` exports from `setup/*.ts` are preserved — tests reference them directly
- The `ConfigOptions` type is retired; its fields are distributed between `Plugin` and `OutputConfig`
- The `ConfigFile` type is retired; replaced by `OutputConfig`
- `RuleConfig` type in `rule-list.ts` is retired; replaced by `Plugin` class
- TDD applies: tests are written before implementation for each class and each pipeline change
- ESLint and `tsc --noEmit` run after every file change
