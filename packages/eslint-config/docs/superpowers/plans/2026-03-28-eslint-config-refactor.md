# ESLint Config Plugin Class Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the string-key dispatch system with `Plugin` and `OutputConfig` classes so every ESLint plugin is fully described in its own setup file and adding/moving a plugin requires touching one file.

**Architecture:** Each `setup/*.ts` file exports a `Plugin` instance containing all metadata for that plugin. An `OutputConfig` registry in `src/build/output-config.ts` groups plugins into output files. The build pipeline iterates `outputConfigs` directly — no switch statements, no type-string lookups.

**Tech Stack:** TypeScript, Vitest, ESLint flat config, lodash per-method imports, Node `fs.writeFileSync`

**Spec deviations resolved in this plan:**
- `includeReactVersion` moves to `OutputConfig` (no single Plugin owns it; it's an output-level setting)
- `OutputConfig` gains `extraImports?: string[]` and `extraConfigEntries?: string[]` for Prettier in `config.main.js`

---

## File Map

| Action | File |
|---|---|
| CREATE | `src/build/plugin.ts` |
| CREATE | `src/build/plugin.test.ts` |
| CREATE | `src/build/output-config.ts` |
| CREATE | `src/build/output-config.test.ts` |
| MODIFY | Every `src/setup/*.ts` — add `Plugin` instance export |
| REWRITE | `src/build/create-config-file.ts` |
| REWRITE | `src/build/create-config-file.test.ts` |
| SIMPLIFY | `src/build/update-rules.ts` |
| UPDATE | `src/build/update-rules.test.ts` |
| SIMPLIFY | `src/build/update-readme.ts` |
| UPDATE | `src/build/update-readme.test.ts` |
| UPDATE | `build.ts` |
| CREATE | `src/build/build-output.test.ts` (snapshot tests) |
| DELETE | `src/build/rule-list.ts` |
| DELETE | `src/build/list-utilities.ts` |
| DELETE | `src/build/list-utilities.test.ts` |
| DELETE | `src/build/create-config.ts` |
| DELETE | `src/build/create-config.test.ts` |

---

### Task 1: Plugin class

**Files:**
- Create: `src/build/plugin.ts`
- Create: `src/build/plugin.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/build/plugin.test.ts
import { describe, expect, it } from "vitest";

import { Plugin } from "./plugin.ts";

const base = {
  files: "**/*.ts",
  name: "test-plugin",
  rules: {},
  url: "https://example.com",
};

describe(Plugin, () => {
  it("stores all provided options as readonly properties", () => {
    const plugin = new Plugin({
      ...base,
      importString: 'import foo from "foo";',
      pluginName: "foo",
      pluginValue: "foo",
      order: 3,
    });

    expect(plugin.name).toBe("test-plugin");
    expect(plugin.files).toBe("**/*.ts");
    expect(plugin.importString).toBe('import foo from "foo";');
    expect(plugin.pluginName).toBe("foo");
    expect(plugin.order).toBe(3);
  });

  describe("ruleCount", () => {
    it("returns 0 for empty rules", () => {
      expect(new Plugin({ ...base, rules: {} }).ruleCount).toBe(0);
    });

    it("counts only non-off rules", () => {
      const plugin = new Plugin({
        ...base,
        rules: { "rule-a": "error", "rule-b": "warn", "rule-c": "off" },
      });

      expect(plugin.ruleCount).toBe(2);
    });

    it("counts rules with array config as non-off", () => {
      const plugin = new Plugin({
        ...base,
        rules: { "rule-a": ["error", { option: true }], "rule-b": "off" },
      });

      expect(plugin.ruleCount).toBe(1);
    });
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm --filter @ethang/eslint-config exec vitest run src/build/plugin.test.ts
```

Expected: FAIL — `Plugin` not found

- [ ] **Step 3: Implement Plugin class**

```ts
// src/build/plugin.ts
import type { Linter } from "eslint";

export type PluginOptions = {
  auxiliaryImport?: string;
  extraOptions?: string;
  extraRules?: Record<string, string>;
  files: string;
  importString?: string;
  includeAngularLanguageOptions?: boolean;
  language?: string;
  name: string;
  order?: number;
  pluginName?: string;
  pluginValue?: string;
  processor?: string;
  rules: Linter.RulesRecord;
  url: string;
};

export class Plugin {
  readonly auxiliaryImport?: string;
  readonly extraOptions?: string;
  readonly extraRules?: Record<string, string>;
  readonly files: string;
  readonly importString?: string;
  readonly includeAngularLanguageOptions?: boolean;
  readonly language?: string;
  readonly name: string;
  readonly order?: number;
  readonly pluginName?: string;
  readonly pluginValue?: string;
  readonly processor?: string;
  readonly rules: Linter.RulesRecord;
  readonly url: string;

  constructor(options: PluginOptions) {
    this.auxiliaryImport = options.auxiliaryImport;
    this.extraOptions = options.extraOptions;
    this.extraRules = options.extraRules;
    this.files = options.files;
    this.importString = options.importString;
    this.includeAngularLanguageOptions = options.includeAngularLanguageOptions;
    this.language = options.language;
    this.name = options.name;
    this.order = options.order;
    this.pluginName = options.pluginName;
    this.pluginValue = options.pluginValue;
    this.processor = options.processor;
    this.rules = options.rules;
    this.url = options.url;
  }

  get ruleCount(): number {
    return Object.values(this.rules).filter((value) => {
      return "off" !== value;
    }).length;
  }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
pnpm --filter @ethang/eslint-config exec vitest run src/build/plugin.test.ts
```

Expected: PASS

- [ ] **Step 5: Lint and type-check**

```bash
pnpm eslint packages/eslint-config/src/build/plugin.ts packages/eslint-config/src/build/plugin.test.ts --fix
pnpm --filter @ethang/eslint-config exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add packages/eslint-config/src/build/plugin.ts packages/eslint-config/src/build/plugin.test.ts
git commit -m "feat(eslint-config): add Plugin class"
```

---

### Task 2: OutputConfig class

**Files:**
- Create: `src/build/output-config.ts` (class only — registry added in Task 7)
- Create: `src/build/output-config.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/build/output-config.test.ts
import { describe, expect, it } from "vitest";

import { OutputConfig } from "./output-config.ts";
import { Plugin } from "./plugin.ts";

const makePlugin = (files: string, rules: Record<string, string> = {}) => {
  return new Plugin({ files, name: "test", rules, url: "https://example.com" });
};

describe(OutputConfig, () => {
  it("stores all provided options as readonly properties", () => {
    const plugin = makePlugin("**/*.ts");
    const config = new OutputConfig({
      fileName: "config.test.js",
      includeIgnores: true,
      includeLanguageOptions: true,
      plugins: [plugin],
    });

    expect(config.fileName).toBe("config.test.js");
    expect(config.plugins).toHaveLength(1);
    expect(config.includeIgnores).toBe(true);
    expect(config.includeLanguageOptions).toBe(true);
  });

  describe("ruleCount", () => {
    it("returns sum of all plugin ruleCounts", () => {
      const p1 = makePlugin("**/*.ts", { "rule-a": "error", "rule-b": "off" });
      const p2 = makePlugin("**/*.ts", { "rule-c": "warn" });
      const config = new OutputConfig({ fileName: "config.test.js", plugins: [p1, p2] });

      expect(config.ruleCount).toBe(2);
    });
  });

  describe("pluginsByFiles", () => {
    it("groups plugins by files value", () => {
      const ts1 = makePlugin("**/*.ts", { "rule-a": "error" });
      const ts2 = makePlugin("**/*.ts", { "rule-b": "warn" });
      const md = makePlugin("**/*.md", { "rule-c": "error" });
      const config = new OutputConfig({ fileName: "config.test.js", plugins: [ts1, ts2, md] });

      expect(Object.keys(config.pluginsByFiles)).toHaveLength(2);
      expect(config.pluginsByFiles["**/*.ts"]).toHaveLength(2);
      expect(config.pluginsByFiles["**/*.md"]).toHaveLength(1);
    });
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm --filter @ethang/eslint-config exec vitest run src/build/output-config.test.ts
```

Expected: FAIL — `OutputConfig` not found

- [ ] **Step 3: Implement OutputConfig class**

```ts
// src/build/output-config.ts
import groupBy from "lodash/groupBy.js";

import type { Plugin } from "./plugin.ts";

export type OutputConfigOptions = {
  extraConfigEntries?: string[];
  extraImports?: string[];
  fileName: string;
  functionParameters?: string;
  globalIgnores?: string[];
  includeIgnores?: boolean;
  includeLanguageOptions?: boolean;
  includeReactVersion?: boolean;
  plugins: Plugin[];
  readmeImport?: string;
  readmeLabel?: string;
};

export class OutputConfig {
  readonly extraConfigEntries?: string[];
  readonly extraImports?: string[];
  readonly fileName: string;
  readonly functionParameters?: string;
  readonly globalIgnores?: string[];
  readonly includeIgnores?: boolean;
  readonly includeLanguageOptions?: boolean;
  readonly includeReactVersion?: boolean;
  readonly plugins: Plugin[];
  readonly readmeImport?: string;
  readonly readmeLabel?: string;

  constructor(options: OutputConfigOptions) {
    this.extraConfigEntries = options.extraConfigEntries;
    this.extraImports = options.extraImports;
    this.fileName = options.fileName;
    this.functionParameters = options.functionParameters;
    this.globalIgnores = options.globalIgnores;
    this.includeIgnores = options.includeIgnores;
    this.includeLanguageOptions = options.includeLanguageOptions;
    this.includeReactVersion = options.includeReactVersion;
    this.plugins = options.plugins;
    this.readmeImport = options.readmeImport;
    this.readmeLabel = options.readmeLabel;
  }

  get ruleCount(): number {
    return this.plugins.reduce((sum, plugin) => {
      return sum + plugin.ruleCount;
    }, 0);
  }

  get pluginsByFiles(): Record<string, Plugin[]> {
    return groupBy(this.plugins, (plugin) => {
      return plugin.files;
    });
  }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
pnpm --filter @ethang/eslint-config exec vitest run src/build/output-config.test.ts
```

Expected: PASS

- [ ] **Step 5: Lint and type-check**

```bash
pnpm eslint packages/eslint-config/src/build/output-config.ts packages/eslint-config/src/build/output-config.test.ts --fix
pnpm --filter @ethang/eslint-config exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add packages/eslint-config/src/build/output-config.ts packages/eslint-config/src/build/output-config.test.ts
git commit -m "feat(eslint-config): add OutputConfig class"
```

---

### Task 3: Plugin instances — standalone outputs

Add `Plugin` instance exports to vitest, astro, html, storybook, solid, and react setup files. No test step — these are data objects; integration tests in Task 8 verify correctness. Verification: lint + tsc after each file.

**Files:** `src/setup/vitest.ts`, `src/setup/astro.ts`, `src/setup/html.ts`, `src/setup/storybook.ts`, `src/setup/solid.ts`, `src/setup/react.ts`

- [ ] **Step 1: Add to `src/setup/vitest.ts`**

Append after the existing `vitestRules` export:

```ts
import { Plugin } from "../build/plugin.ts";

export const vitestPlugin = new Plugin({
  files: "**/*.test.{ts,tsx,js,jsx,mjs,cjs}",
  importString: 'import vitest from "@vitest/eslint-plugin";',
  name: "@vitest/eslint-plugin",
  order: 0,
  pluginName: "vitest",
  pluginValue: "vitest",
  rules: vitestRules,
  url: "https://github.com/vitest-dev/eslint-plugin-vitest",
});
```

- [ ] **Step 2: Add to `src/setup/astro.ts`**

Append after the existing `astroRules` export:

```ts
import { Plugin } from "../build/plugin.ts";

export const astroPlugin = new Plugin({
  files: "**/*.{astro}",
  importString: 'import astro from "eslint-plugin-astro";',
  name: "eslint-plugin-astro",
  pluginName: "astro",
  pluginValue: "astro",
  rules: astroRules,
  url: "https://github.com/ota-meshi/eslint-plugin-astro",
});
```

- [ ] **Step 3: Add to `src/setup/html.ts`**

Append after the existing `htmlRules` export:

```ts
import { Plugin } from "../build/plugin.ts";

export const htmlPlugin = new Plugin({
  extraRules: { "prettier/prettier": "off" },
  files: "**/*.html",
  importString: 'import html from "@html-eslint/eslint-plugin";',
  language: "html/html",
  name: "@html-eslint/eslint-plugin",
  order: 0,
  pluginName: "html",
  pluginValue: "html",
  rules: htmlRules,
  url: "https://github.com/html-eslint/html-eslint",
});
```

- [ ] **Step 4: Add to `src/setup/storybook.ts`**

Append after the existing `storybookRules` export:

```ts
import { Plugin } from "../build/plugin.ts";

export const storybookPlugin = new Plugin({
  files: "**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)",
  importString: 'import storybook from "eslint-plugin-storybook";',
  name: "eslint-plugin-storybook",
  pluginName: "storybook",
  pluginValue: "storybook",
  rules: storybookRules,
  url: "https://github.com/storybookjs/eslint-plugin-storybook",
});
```

- [ ] **Step 5: Add to `src/setup/solid.ts`**

Append after the existing `solidRules` export:

```ts
import { Plugin } from "../build/plugin.ts";

export const solidPlugin = new Plugin({
  files: "**/*.{jsx,tsx}",
  importString: 'import solid from "eslint-plugin-solid";',
  name: "eslint-plugin-solid",
  pluginName: "solid",
  pluginValue: "solid",
  rules: solidRules,
  url: "https://github.com/solidjs-community/eslint-plugin-solid",
});
```

- [ ] **Step 6: Add to `src/setup/react.ts`**

`react.ts` exports two rule sets — it gets two Plugin instances. Append after the existing exports:

```ts
import { Plugin } from "../build/plugin.ts";

export const reactPlugin = new Plugin({
  files: "**/*.{jsx,tsx}",
  importString: 'import react from "@eslint-react/eslint-plugin";',
  name: "@eslint-react/eslint-plugin",
  pluginName: "react",
  pluginValue: "react",
  rules: reactRules,
  url: "https://eslint-react.xyz/",
});

export const reactHooksPlugin = new Plugin({
  files: "**/*.{jsx,tsx}",
  importString: 'import reactHooks from "eslint-plugin-react-hooks";',
  name: "eslint-plugin-react-hooks",
  pluginName: "react-hooks",
  pluginValue: "reactHooks",
  rules: reactHookRules,
  url: "https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks",
});
```

- [ ] **Step 7: Lint and type-check**

```bash
pnpm eslint packages/eslint-config/src/setup/vitest.ts packages/eslint-config/src/setup/astro.ts packages/eslint-config/src/setup/html.ts packages/eslint-config/src/setup/storybook.ts packages/eslint-config/src/setup/solid.ts packages/eslint-config/src/setup/react.ts --fix
pnpm --filter @ethang/eslint-config exec tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add packages/eslint-config/src/setup/vitest.ts packages/eslint-config/src/setup/astro.ts packages/eslint-config/src/setup/html.ts packages/eslint-config/src/setup/storybook.ts packages/eslint-config/src/setup/solid.ts packages/eslint-config/src/setup/react.ts
git commit -m "feat(eslint-config): add Plugin instances to standalone output setup files"
```

---

### Task 4: Plugin instances — file-type and tailwind

**Files:** `src/setup/css.ts`, `src/setup/markdown.ts`, `src/setup/json.ts`, `src/setup/tailwind.ts`

- [ ] **Step 1: Add to `src/setup/css.ts`**

```ts
import { Plugin } from "../build/plugin.ts";

export const cssPlugin = new Plugin({
  files: "**/*.css",
  importString: "import css from '@eslint/css';",
  language: "css/css",
  name: "@eslint/css",
  order: 0,
  pluginName: "css",
  pluginValue: "css",
  rules: cssRules,
  url: "https://github.com/eslint/css",
});
```

- [ ] **Step 2: Add to `src/setup/markdown.ts`**

```ts
import { Plugin } from "../build/plugin.ts";

export const markdownPlugin = new Plugin({
  files: "**/*.md",
  importString: 'import markdown from "@eslint/markdown";',
  name: "@eslint/markdown",
  order: 0,
  pluginName: "markdown",
  pluginValue: "markdown",
  rules: markdownRules,
  url: "https://github.com/eslint/markdown",
});
```

- [ ] **Step 3: Add to `src/setup/json.ts`**

`json.ts` exports one `jsonRules` object used for three file types. It gets three Plugin instances:

```ts
import { Plugin } from "../build/plugin.ts";

const eslintJson = "@eslint/json";
const eslintJsonUrl = "https://github.com/eslint/json";
const jsonImportString = 'import json from "@eslint/json";';

export const jsonPlugin = new Plugin({
  files: "**/*.json",
  importString: jsonImportString,
  language: "json/json",
  name: eslintJson,
  order: 0,
  pluginName: "json",
  pluginValue: "json",
  rules: jsonRules,
  url: eslintJsonUrl,
});

export const jsoncPlugin = new Plugin({
  files: "**/*.jsonc",
  importString: jsonImportString,
  language: "json/jsonc",
  name: eslintJson,
  order: 0,
  pluginName: "json",
  pluginValue: "json",
  rules: jsonRules,
  url: eslintJsonUrl,
});

export const json5Plugin = new Plugin({
  files: "**/*.json5",
  importString: jsonImportString,
  language: "json/json5",
  name: eslintJson,
  order: 0,
  pluginName: "json",
  pluginValue: "json",
  rules: jsonRules,
  url: eslintJsonUrl,
});
```

- [ ] **Step 4: Add to `src/setup/tailwind.ts`**

```ts
import { Plugin } from "../build/plugin.ts";

export const tailwindPlugin = new Plugin({
  extraOptions: "settings: { tailwindcss: { config: pathToConfig } },",
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString:
    'import { fixupPluginRules } from "@eslint/compat";\nimport tailwind from "eslint-plugin-tailwindcss";',
  name: "eslint-plugin-tailwindcss",
  order: 0,
  pluginName: "tailwind",
  pluginValue: "fixupPluginRules(tailwind)",
  rules: tailwindRules,
  url: "https://github.com/francoismassart/eslint-plugin-tailwindcss",
});
```

- [ ] **Step 5: Lint and type-check**

```bash
pnpm eslint packages/eslint-config/src/setup/css.ts packages/eslint-config/src/setup/markdown.ts packages/eslint-config/src/setup/json.ts packages/eslint-config/src/setup/tailwind.ts --fix
pnpm --filter @ethang/eslint-config exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add packages/eslint-config/src/setup/css.ts packages/eslint-config/src/setup/markdown.ts packages/eslint-config/src/setup/json.ts packages/eslint-config/src/setup/tailwind.ts
git commit -m "feat(eslint-config): add Plugin instances to file-type and tailwind setup files"
```

---

### Task 5: Plugin instances — angular

**Files:** `src/setup/angular.ts`

- [ ] **Step 1: Add to `src/setup/angular.ts`**

Append after the existing exports:

```ts
import { Plugin } from "../build/plugin.ts";

export const angularTsPlugin = new Plugin({
  auxiliaryImport: 'import angular from "angular-eslint";',
  files: "**/*.ts",
  importString: 'import angularTS from "@angular-eslint/eslint-plugin";',
  name: "@angular-eslint/eslint-plugin",
  pluginName: "@angular-eslint",
  pluginValue: "angularTS",
  processor: "angular.processInlineTemplates",
  rules: angularTsRules,
  url: "https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/README.md",
});

export const angularTemplatePlugin = new Plugin({
  files: "**/*.html",
  importString:
    'import angularTemplate from "@angular-eslint/eslint-plugin-template";',
  includeAngularLanguageOptions: true,
  name: "@angular-eslint/eslint-plugin-template",
  pluginName: "@angular-eslint/template",
  pluginValue: "angularTemplate",
  rules: angularTemplateRules,
  url: "https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/README.md",
});
```

- [ ] **Step 2: Lint and type-check**

```bash
pnpm eslint packages/eslint-config/src/setup/angular.ts --fix
pnpm --filter @ethang/eslint-config exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/eslint-config/src/setup/angular.ts
git commit -m "feat(eslint-config): add Plugin instances to angular setup file"
```

---

### Task 6: Plugin instances — core bundle

**Files:** `src/setup/compat.ts`, `src/setup/eslint.ts`, `src/setup/typescript-eslint.ts`, `src/setup/unicorn.ts`, `src/setup/lodash.ts`, `src/setup/sonar.ts`, `src/setup/perfectionist.ts`, `src/setup/tanstack-query.ts`, `src/setup/tanstack-router.ts`, `src/setup/a11y.ts`, `src/setup/cspell.ts`

All core plugins target `"**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}"`.

- [ ] **Step 1: Add to `src/setup/compat.ts`**

```ts
import { Plugin } from "../build/plugin.ts";

export const compatPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import compat from "eslint-plugin-compat";',
  name: "eslint-plugin-compat",
  order: 0,
  pluginName: "compat",
  pluginValue: "compat",
  rules: compatRules,
  url: "https://github.com/amilajack/eslint-plugin-compat",
});
```

- [ ] **Step 2: Add to `src/setup/eslint.ts`**

```ts
import { Plugin } from "../build/plugin.ts";

export const eslintPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  name: "@eslint/js",
  order: 1,
  rules: eslintRules,
  url: "https://github.com/eslint/eslint/tree/main/packages/js",
});
```

- [ ] **Step 3: Add to `src/setup/typescript-eslint.ts`**

```ts
import { Plugin } from "../build/plugin.ts";

export const typescriptPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import tseslint from "typescript-eslint";',
  name: "@typescript/eslint",
  order: 2,
  pluginName: "@typescript-eslint",
  pluginValue: "tseslint.plugin",
  rules: typescriptRules,
  url: "https://github.com/typescript-eslint/typescript-eslint",
});
```

- [ ] **Step 4: Add to `src/setup/unicorn.ts`**

```ts
import { Plugin } from "../build/plugin.ts";

export const unicornPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import unicorn from "eslint-plugin-unicorn";',
  name: "sindresorhus/eslint-plugin-unicorn",
  order: 3,
  pluginName: "unicorn",
  pluginValue: "unicorn",
  rules: unicornRules,
  url: "https://github.com/sindresorhus/eslint-plugin-unicorn",
});
```

- [ ] **Step 5: Add to `src/setup/lodash.ts`**

```ts
import { Plugin } from "../build/plugin.ts";

export const lodashPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString:
    'import { fixupPluginRules } from "@eslint/compat";\nimport lodashConfig from "eslint-plugin-lodash";',
  name: "eslint-plugin-lodash",
  order: 4,
  pluginName: "lodash",
  pluginValue: "fixupPluginRules(lodashConfig)",
  rules: lodashRules,
  url: "https://github.com/idok/eslint-plugin-lodash",
});
```

- [ ] **Step 6: Add to `src/setup/sonar.ts`**

```ts
import { Plugin } from "../build/plugin.ts";

export const sonarPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import sonar from "eslint-plugin-sonarjs";',
  name: "eslint-plugin-sonarjs",
  order: 5,
  pluginName: "sonar",
  pluginValue: "sonar",
  rules: sonarRules,
  url: "https://github.com/SonarSource/SonarJS/blob/master/packages/jsts/src/rules/README.md",
});
```

- [ ] **Step 7: Add to `src/setup/perfectionist.ts`**

```ts
import { Plugin } from "../build/plugin.ts";

export const perfectionistPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import perfectionist from "eslint-plugin-perfectionist";',
  name: "eslint-plugin-perfectionist",
  order: 6,
  pluginName: "perfectionist",
  pluginValue: "perfectionist",
  rules: perfectionistRules,
  url: "https://github.com/azat-io/eslint-plugin-perfectionist",
});
```

- [ ] **Step 8: Add to `src/setup/tanstack-query.ts`**

```ts
import { Plugin } from "../build/plugin.ts";

export const tanstackQueryPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import tanstackQuery from "@tanstack/eslint-plugin-query";',
  name: "@tanstack/eslint-plugin-query",
  order: 7,
  pluginName: "@tanstack/query",
  pluginValue: "tanstackQuery",
  rules: tanstackQueryRules,
  url: "https://tanstack.com/query/latest/docs/eslint/eslint-plugin-query",
});
```

- [ ] **Step 9: Add to `src/setup/tanstack-router.ts`**

```ts
import { Plugin } from "../build/plugin.ts";

export const tanstackRouterPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import tanstackRouter from "@tanstack/eslint-plugin-router";',
  name: "@tanstack/eslint-plugin-router",
  order: 8,
  pluginName: "@tanstack/router",
  pluginValue: "tanstackRouter",
  rules: tanstackRouterRules,
  url: "https://tanstack.com/router/latest/docs/eslint/eslint-plugin-router",
});
```

- [ ] **Step 10: Add to `src/setup/a11y.ts`**

```ts
import { Plugin } from "../build/plugin.ts";

export const a11yPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import a11y from "eslint-plugin-jsx-a11y";',
  name: "jsx-a11y",
  order: 9,
  pluginName: "a11y",
  pluginValue: "a11y",
  rules: a11yRules,
  url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y",
});
```

- [ ] **Step 11: Add to `src/setup/cspell.ts`**

```ts
import { Plugin } from "../build/plugin.ts";

export const cspellPlugin = new Plugin({
  files: "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}",
  importString: 'import cspell from "@cspell/eslint-plugin";',
  name: "@cspell/eslint-plugin",
  order: 10,
  pluginName: "cspell",
  pluginValue: "cspell",
  rules: cspellRules,
  url: "https://github.com/streetsidesoftware/cspell/tree/main/packages/cspell-eslint-plugin",
});
```

- [ ] **Step 12: Lint and type-check**

```bash
pnpm eslint packages/eslint-config/src/setup/compat.ts packages/eslint-config/src/setup/eslint.ts packages/eslint-config/src/setup/typescript-eslint.ts packages/eslint-config/src/setup/unicorn.ts packages/eslint-config/src/setup/lodash.ts packages/eslint-config/src/setup/sonar.ts packages/eslint-config/src/setup/perfectionist.ts packages/eslint-config/src/setup/tanstack-query.ts packages/eslint-config/src/setup/tanstack-router.ts packages/eslint-config/src/setup/a11y.ts packages/eslint-config/src/setup/cspell.ts --fix
pnpm --filter @ethang/eslint-config exec tsc --noEmit
```

- [ ] **Step 13: Commit**

```bash
git add packages/eslint-config/src/setup/
git commit -m "feat(eslint-config): add Plugin instances to core bundle setup files"
```

---

### Task 7: OutputConfig registry

Complete `src/build/output-config.ts` by adding the `outputConfigs` registry array beneath the `OutputConfig` class.

**Files:** `src/build/output-config.ts`

- [ ] **Step 1: Add imports and registry to `src/build/output-config.ts`**

Append after the `OutputConfig` class:

```ts
import { a11yPlugin } from "../setup/a11y.ts";
import { angularTemplatePlugin, angularTsPlugin } from "../setup/angular.ts";
import { astroPlugin } from "../setup/astro.ts";
import { compatPlugin } from "../setup/compat.ts";
import { cspellPlugin } from "../setup/cspell.ts";
import { cssPlugin } from "../setup/css.ts";
import { eslintPlugin } from "../setup/eslint.ts";
import { htmlPlugin } from "../setup/html.ts";
import { json5Plugin, jsoncPlugin, jsonPlugin } from "../setup/json.ts";
import { lodashPlugin } from "../setup/lodash.ts";
import { markdownPlugin } from "../setup/markdown.ts";
import { perfectionistPlugin } from "../setup/perfectionist.ts";
import { reactHooksPlugin, reactPlugin } from "../setup/react.ts";
import { solidPlugin } from "../setup/solid.ts";
import { sonarPlugin } from "../setup/sonar.ts";
import { storybookPlugin } from "../setup/storybook.ts";
import { tailwindPlugin } from "../setup/tailwind.ts";
import { tanstackQueryPlugin } from "../setup/tanstack-query.ts";
import { tanstackRouterPlugin } from "../setup/tanstack-router.ts";
import { typescriptPlugin } from "../setup/typescript-eslint.ts";
import { unicornPlugin } from "../setup/unicorn.ts";
import { vitestPlugin } from "../setup/vitest.ts";

export const outputConfigs: OutputConfig[] = [
  new OutputConfig({
    extraConfigEntries: [
      "eslintConfigPrettier",
      "eslintPluginPrettierRecommended",
    ],
    extraImports: [
      'import eslintConfigPrettier from "eslint-config-prettier";',
      'import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";',
    ],
    fileName: "config.main.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    includeReactVersion: true,
    plugins: [
      compatPlugin,
      eslintPlugin,
      typescriptPlugin,
      unicornPlugin,
      lodashPlugin,
      sonarPlugin,
      perfectionistPlugin,
      tanstackQueryPlugin,
      tanstackRouterPlugin,
      a11yPlugin,
      cspellPlugin,
      markdownPlugin,
      cssPlugin,
      jsonPlugin,
      jsoncPlugin,
      json5Plugin,
    ],
  }),
  new OutputConfig({
    fileName: "config.html.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [htmlPlugin],
    readmeImport:
      'import htmlConfig from "@ethang/eslint-config/config.html.js";',
    readmeLabel: "HTML",
  }),
  new OutputConfig({
    fileName: "config.astro.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [astroPlugin],
    readmeImport:
      'import astroConfig from "@ethang/eslint-config/config.astro.js";',
    readmeLabel: "Astro",
  }),
  new OutputConfig({
    fileName: "config.react.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    includeReactVersion: true,
    plugins: [reactPlugin, reactHooksPlugin],
    readmeImport:
      'import reactConfig from "@ethang/eslint-config/config.react.js";',
    readmeLabel: "React",
  }),
  new OutputConfig({
    fileName: "config.solid.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [solidPlugin],
    readmeImport:
      'import solidConfig from "@ethang/eslint-config/config.solid.js";',
    readmeLabel: "Solid",
  }),
  new OutputConfig({
    fileName: "config.angular.js",
    globalIgnores: ["**/*.spec.ts", "src/main.server.ts"],
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [angularTsPlugin, angularTemplatePlugin],
    readmeImport:
      'import angularConfig from "@ethang/eslint-config/config.angular.js";',
    readmeLabel: "Angular",
  }),
  new OutputConfig({
    fileName: "config.storybook.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [storybookPlugin],
    readmeImport:
      'import storybookConfig from "@ethang/eslint-config/config.storybook.js";',
    readmeLabel: "Storybook",
  }),
  new OutputConfig({
    fileName: "config.tailwind.js",
    functionParameters: "/** @type {string} */ pathToConfig",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [tailwindPlugin],
    readmeImport:
      'import tailwindConfig from "@ethang/eslint-config/config.tailwind.js";',
    readmeLabel: "Tailwind",
  }),
  new OutputConfig({
    fileName: "config.vitest.js",
    includeIgnores: true,
    includeLanguageOptions: true,
    plugins: [vitestPlugin],
    readmeImport:
      'import vitestConfig from "@ethang/eslint-config/config.vitest.js";',
    readmeLabel: "Vitest",
  }),
];
```

- [ ] **Step 2: Lint and type-check**

```bash
pnpm eslint packages/eslint-config/src/build/output-config.ts --fix
pnpm --filter @ethang/eslint-config exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/eslint-config/src/build/output-config.ts
git commit -m "feat(eslint-config): add OutputConfig registry"
```

---

### Task 8: Rewrite create-config-file.ts

This is the core transformation. The new implementation groups plugins by `files`, merges rules per group, and assembles the output file. The old `create-config.ts` logic is absorbed here.

**Files:**
- Rewrite: `src/build/create-config-file.ts`
- Rewrite: `src/build/create-config-file.test.ts`

- [ ] **Step 1: Write the failing tests**

Replace the contents of `src/build/create-config-file.test.ts`:

```ts
// src/build/create-config-file.test.ts
import { writeFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OutputConfig } from "./output-config.ts";
import { Plugin } from "./plugin.ts";
import { createConfigFile } from "./create-config-file.ts";

vi.mock(import("node:fs"));
vi.mock(import("./get-react-version.ts"), () => ({
  getLatestReact: vi.fn().mockResolvedValue({ version: "19.0.0" }),
}));

const makePlugin = (
  overrides: Partial<ConstructorParameters<typeof Plugin>[0]> = {},
) => {
  return new Plugin({
    files: "**/*.ts",
    importString: 'import testPlugin from "test-plugin";',
    name: "test-plugin",
    pluginName: "test",
    pluginValue: "testPlugin",
    rules: { "test-rule": "error" },
    url: "https://example.com",
    ...overrides,
  });
};

const getWrittenContent = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const calls = (writeFileSync as unknown as { mock: { calls: unknown[][] } })
    .mock.calls;
  return calls.at(-1)?.[1] as string;
};

const getWrittenPath = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const calls = (writeFileSync as unknown as { mock: { calls: unknown[][] } })
    .mock.calls;
  return calls.at(-1)?.[0] as string;
};

describe(createConfigFile, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes to the correct path", async () => {
    const output = new OutputConfig({
      fileName: "config.test.js",
      plugins: [makePlugin()],
    });

    await createConfigFile(output);

    const expectedPath = path.join(
      import.meta.dirname,
      "../config.test.js",
    );
    expect(getWrittenPath()).toBe(expectedPath);
  });

  it("generates file with ts-nocheck header, imports, and defineConfig", async () => {
    const output = new OutputConfig({
      fileName: "config.test.js",
      plugins: [makePlugin()],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    expect(content).toContain("// @ts-nocheck");
    expect(content).toContain(
      'import { defineConfig, globalIgnores } from "eslint/config";',
    );
    expect(content).toContain('import testPlugin from "test-plugin";');
    expect(content).toContain('files: ["**/*.ts"]');
    expect(content).toContain('"test": testPlugin');
    expect(content).toContain('"test-rule": "error"');
    expect(content).toContain("export default defineConfig(");
  });

  it("merges plugins with same files into one config block", async () => {
    const p1 = makePlugin({
      importString: 'import p1 from "p1";',
      pluginName: "p1",
      pluginValue: "plugin1",
      rules: { "rule-a": "error" },
    });
    const p2 = makePlugin({
      importString: 'import p2 from "p2";',
      pluginName: "p2",
      pluginValue: "plugin2",
      rules: { "rule-b": "warn" },
    });
    const output = new OutputConfig({
      fileName: "config.test.js",
      plugins: [p1, p2],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    const fileMatches = content.match(/files: \["\*\*\/\*\.ts"\]/g);
    expect(fileMatches).toHaveLength(1);
    expect(content).toContain('"p1": plugin1');
    expect(content).toContain('"p2": plugin2');
    expect(content).toContain('"rule-a": "error"');
    expect(content).toContain('"rule-b": "warn"');
  });

  it("creates separate blocks for plugins with different files", async () => {
    const tsPlugin = makePlugin({ files: "**/*.ts" });
    const mdPlugin = makePlugin({
      files: "**/*.md",
      importString: 'import md from "md";',
      pluginName: "md",
      pluginValue: "markdown",
    });
    const output = new OutputConfig({
      fileName: "config.test.js",
      plugins: [tsPlugin, mdPlugin],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    expect(content).toContain('files: ["**/*.ts"]');
    expect(content).toContain('files: ["**/*.md"]');
  });

  it("prepends globalIgnores(ignores) when includeIgnores is true", async () => {
    const output = new OutputConfig({
      fileName: "config.test.js",
      includeIgnores: true,
      plugins: [makePlugin()],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    expect(content).toContain("globalIgnores(ignores)");
    expect(content).toContain("ignores");
  });

  it("prepends specific globalIgnores when globalIgnores is set", async () => {
    const output = new OutputConfig({
      fileName: "config.test.js",
      globalIgnores: ["**/*.spec.ts"],
      plugins: [makePlugin()],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    expect(content).toContain('globalIgnores(["**/*.spec.ts"])');
  });

  it("adds languageOptions when includeLanguageOptions is true", async () => {
    const output = new OutputConfig({
      fileName: "config.test.js",
      includeLanguageOptions: true,
      plugins: [makePlugin()],
    });

    await createConfigFile(output);

    expect(getWrittenContent()).toContain("languageOptions,");
  });

  it("wraps output in a function when functionParameters is set", async () => {
    const output = new OutputConfig({
      fileName: "config.test.js",
      functionParameters: "pathToConfig",
      plugins: [makePlugin()],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    expect(content).toContain("const config = (pathToConfig) => {");
    expect(content).toContain("export default config;");
    expect(content).not.toContain("export default defineConfig(");
  });

  it("appends extraConfigEntries and their imports", async () => {
    const output = new OutputConfig({
      extraConfigEntries: ["eslintConfigPrettier"],
      extraImports: ['import eslintConfigPrettier from "eslint-config-prettier";'],
      fileName: "config.test.js",
      plugins: [makePlugin()],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    expect(content).toContain("eslintConfigPrettier");
    expect(content).toContain(
      'import eslintConfigPrettier from "eslint-config-prettier";',
    );
  });

  it("includes react version settings when includeReactVersion is true", async () => {
    const output = new OutputConfig({
      fileName: "config.test.js",
      includeReactVersion: true,
      plugins: [makePlugin()],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    expect(content).toContain("settings:");
    expect(content).toContain('"version":"19.0.0"');
  });

  it("adds language when plugin has language set", async () => {
    const output = new OutputConfig({
      fileName: "config.test.js",
      plugins: [makePlugin({ language: "css/css", files: "**/*.css" })],
    });

    await createConfigFile(output);

    expect(getWrittenContent()).toContain('language: "css/css"');
  });

  it("adds processor when plugin has processor set", async () => {
    const output = new OutputConfig({
      fileName: "config.test.js",
      plugins: [
        makePlugin({ processor: "angular.processInlineTemplates" }),
      ],
    });

    await createConfigFile(output);

    expect(getWrittenContent()).toContain(
      "processor: angular.processInlineTemplates,",
    );
  });

  it("uses angularLanguageOptions when plugin has includeAngularLanguageOptions", async () => {
    const output = new OutputConfig({
      fileName: "config.test.js",
      plugins: [makePlugin({ includeAngularLanguageOptions: true })],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    expect(content).toContain("languageOptions: angularLanguageOptions,");
    expect(content).toContain(
      'import { angularLanguageOptions } from "./constants.js";',
    );
  });

  it("deduplicates imports that appear in multiple plugins", async () => {
    const p1 = makePlugin({
      importString:
        'import { fixupPluginRules } from "@eslint/compat";\nimport p1 from "p1";',
      pluginName: "p1",
      pluginValue: "fixupPluginRules(p1)",
    });
    const p2 = makePlugin({
      files: "**/*.md",
      importString:
        'import { fixupPluginRules } from "@eslint/compat";\nimport p2 from "p2";',
      pluginName: "p2",
      pluginValue: "fixupPluginRules(p2)",
    });
    const output = new OutputConfig({
      fileName: "config.test.js",
      plugins: [p1, p2],
    });

    await createConfigFile(output);

    const content = getWrittenContent();
    const fixupMatches = content.match(
      /import \{ fixupPluginRules \} from "@eslint\/compat";/g,
    );
    expect(fixupMatches).toHaveLength(1);
  });

  it("handles auxiliaryImport for processor references", async () => {
    const output = new OutputConfig({
      fileName: "config.test.js",
      plugins: [
        makePlugin({
          auxiliaryImport: 'import angular from "angular-eslint";',
          processor: "angular.processInlineTemplates",
        }),
      ],
    });

    await createConfigFile(output);

    expect(getWrittenContent()).toContain(
      'import angular from "angular-eslint";',
    );
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm --filter @ethang/eslint-config exec vitest run src/build/create-config-file.test.ts
```

Expected: FAIL — signature mismatch

- [ ] **Step 3: Implement new `create-config-file.ts`**

Replace the entire contents of `src/build/create-config-file.ts`:

```ts
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import split from "lodash/split.js";
import uniq from "lodash/uniq.js";
import { writeFileSync } from "node:fs";
import path from "node:path";

import type { OutputConfig } from "./output-config.ts";
import type { Plugin } from "./plugin.ts";

import { getLatestReact } from "./get-react-version.ts";

export const createConfigFile = async (output: OutputConfig): Promise<void> => {
  let configFile = "// @ts-nocheck\n";

  // Collect and deduplicate imports
  const rawImports: string[] = [
    'import { defineConfig, globalIgnores } from "eslint/config";',
  ];

  if (output.includeIgnores ?? output.includeLanguageOptions) {
    rawImports.push('import { ignores, languageOptions } from "./constants.js";');
  }

  const hasAngularLangOpts = output.plugins.some((p) => {
    return p.includeAngularLanguageOptions;
  });

  if (hasAngularLangOpts) {
    rawImports.push(
      'import { angularLanguageOptions } from "./constants.js";',
    );
  }

  for (const plugin of output.plugins) {
    if (!isNil(plugin.importString)) {
      rawImports.push(...split(plugin.importString, "\n"));
    }

    if (!isNil(plugin.auxiliaryImport)) {
      rawImports.push(plugin.auxiliaryImport);
    }
  }

  if (!isNil(output.extraImports)) {
    rawImports.push(...output.extraImports);
  }

  const importList = uniq(filter(rawImports, Boolean)).toSorted((a, b) => {
    return a.localeCompare(b);
  });

  for (const item of importList) {
    configFile += `${item}\n`;
  }

  // Fetch react version if needed
  let reactSettings: string | undefined;

  if (!isNil(output.includeReactVersion)) {
    const react = await getLatestReact();
    reactSettings = JSON.stringify({
      react: { version: react?.version },
    }).slice(1, -1);
  }

  // Build config entries
  const configEntries: string[] = [];

  if (!isNil(output.includeIgnores)) {
    configEntries.push("globalIgnores(ignores)");
  }

  if (!isNil(output.globalIgnores) && 0 < output.globalIgnores.length) {
    const ignoreList = output.globalIgnores
      .map((g) => `"${g}"`)
      .join(", ");
    configEntries.push(`globalIgnores([${ignoreList}])`);
  }

  // Group plugins by files, preserving insertion order
  const fileGroups = new Map<string, Plugin[]>();

  for (const plugin of output.plugins) {
    const existing = fileGroups.get(plugin.files);

    if (isNil(existing)) {
      fileGroups.set(plugin.files, [plugin]);
    } else {
      existing.push(plugin);
    }
  }

  for (const [files, plugins] of fileGroups) {
    const sorted = [...plugins].toSorted((a, b) => {
      return (a.order ?? 0) - (b.order ?? 0);
    });

    // Merge rules from all plugins in this group
    const mergedRules: Record<string, unknown> = {};

    for (const plugin of sorted) {
      Object.assign(mergedRules, plugin.rules);

      if (!isNil(plugin.extraRules)) {
        Object.assign(mergedRules, plugin.extraRules);
      }
    }

    const rulesJson = JSON.stringify(mergedRules).slice(1, -1);

    // Build plugins object string
    let pluginsStr = "";

    for (const plugin of sorted) {
      if (!isNil(plugin.pluginName) && !isNil(plugin.pluginValue)) {
        pluginsStr += `"${plugin.pluginName}": ${plugin.pluginValue},`;
      }
    }

    // Build optional config block fields
    let optionals = "";

    const hasAngularLang = sorted.some((p) => {
      return p.includeAngularLanguageOptions;
    });

    if (!isNil(output.includeLanguageOptions) && !hasAngularLang) {
      optionals += "\nlanguageOptions,";
    }

    if (hasAngularLang) {
      optionals += "\nlanguageOptions: angularLanguageOptions,";
    }

    const processorPlugin = sorted.find((p) => {
      return !isNil(p.processor);
    });

    if (!isNil(processorPlugin)) {
      optionals += `\nprocessor: ${processorPlugin.processor},`;
    }

    if (!isNil(reactSettings)) {
      optionals += `\nsettings: {\n  ${reactSettings}\n},`;
    }

    const languagePlugin = sorted.find((p) => {
      return !isNil(p.language);
    });

    const languageStr = isNil(languagePlugin)
      ? ""
      : `language: "${languagePlugin.language}",`;

    const extraOpts = sorted
      .filter((p) => {
        return !isNil(p.extraOptions);
      })
      .map((p) => {
        return p.extraOptions;
      })
      .join("\n");

    configEntries.push(`{
    files: ["${files}"],${optionals}${languageStr}
    plugins: {
      ${pluginsStr}
    },
    rules: {
      ${rulesJson}
    },
    ${extraOpts}
  }`);
  }

  if (!isNil(output.extraConfigEntries)) {
    configEntries.push(...output.extraConfigEntries);
  }

  // Assemble final file
  if (isNil(output.functionParameters)) {
    configFile += `\nexport default defineConfig(\n  ${configEntries.join(",\n")}\n);\n`;
  } else {
    configFile += `\nconst config = (${output.functionParameters}) => {\n  return defineConfig(\n    ${configEntries.join(",\n")}\n  );\n}\n\nexport default config;\n`;
  }

  writeFileSync(
    path.join(import.meta.dirname, `../${output.fileName}`),
    configFile,
    "utf8",
  );
};
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm --filter @ethang/eslint-config exec vitest run src/build/create-config-file.test.ts
```

Expected: PASS

- [ ] **Step 5: Lint and type-check**

```bash
pnpm eslint packages/eslint-config/src/build/create-config-file.ts packages/eslint-config/src/build/create-config-file.test.ts --fix
pnpm --filter @ethang/eslint-config exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add packages/eslint-config/src/build/create-config-file.ts packages/eslint-config/src/build/create-config-file.test.ts
git commit -m "feat(eslint-config): rewrite create-config-file to use OutputConfig"
```

---

### Task 9: Simplify update-rules.ts

**Files:** `src/build/update-rules.ts`, `src/build/update-rules.test.ts`

- [ ] **Step 1: Update the test to reflect new call count**

In `src/build/update-rules.test.ts`, replace:

```ts
expect(createConfigFile).toHaveBeenCalledTimes(9);
```

with:

```ts
import { outputConfigs } from "./output-config.ts";
// ...
expect(createConfigFile).toHaveBeenCalledTimes(outputConfigs.length);
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
pnpm --filter @ethang/eslint-config exec vitest run src/build/update-rules.test.ts
```

Expected: FAIL — wrong number of calls (old implementation still uses ConfigFile arrays)

- [ ] **Step 3: Rewrite `src/build/update-rules.ts`**

Replace the entire file:

```ts
import { createConfigFile } from "./create-config-file.ts";
import { outputConfigs } from "./output-config.ts";

export const updateRules = async () => {
  await Promise.all(
    outputConfigs.map((config) => {
      return createConfigFile(config);
    }),
  );
};

/* v8 ignore start */
if (process.argv[1] === import.meta.filename) {
  await updateRules();
}
/* v8 ignore stop */
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
pnpm --filter @ethang/eslint-config exec vitest run src/build/update-rules.test.ts
```

Expected: PASS

- [ ] **Step 5: Lint and type-check**

```bash
pnpm eslint packages/eslint-config/src/build/update-rules.ts packages/eslint-config/src/build/update-rules.test.ts --fix
pnpm --filter @ethang/eslint-config exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add packages/eslint-config/src/build/update-rules.ts packages/eslint-config/src/build/update-rules.test.ts
git commit -m "refactor(eslint-config): simplify update-rules to iterate outputConfigs"
```

---

### Task 10: Simplify update-readme.ts

**Files:** `src/build/update-readme.ts`, `src/build/update-readme.test.ts`

- [ ] **Step 1: Update the test**

In `src/build/update-readme.test.ts`, the existing assertions remain valid. Add one assertion to the first test to verify the Vitest readme entry is still generated:

```ts
expect(content).toContain("config.vitest.js");
expect(content).toContain("Add Even More");
```

- [ ] **Step 2: Run test to confirm the current test still passes (baseline)**

```bash
pnpm --filter @ethang/eslint-config exec vitest run src/build/update-readme.test.ts
```

Expected: PASS (these assertions already exist)

- [ ] **Step 3: Rewrite `src/build/update-readme.ts`**

The imports at the top of the file currently include `getList` from `list-utilities` and several lodash imports. Replace the import block and the "Add Even More!" section with the following. The `md.header`, `md.alert`, `md.newLine`, core rules section, and everything from `md.header(1, "Install"...)` onward stay exactly as they are — only the imports and the featured-outputs list change.

**Replace the entire import block** (lines 1–11 of the current file) with:

```ts
import { MarkdownGenerator } from "@ethang/markdown-generator/markdown-generator.js";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import values from "lodash/values.js";
import { writeFileSync } from "node:fs";
import path from "node:path";

import type { genRules } from "../setup/gen-rules.ts";

import { outputConfigs } from "./output-config.ts";
```

**Replace from `const htmlRules = getList("html");` through the closing `});` of `md.unorderedList(...)` with:**

```ts
  const featuredOutputs = filter(outputConfigs, (c) => {
    return !isNil(c.readmeLabel);
  });

  const listItems: (string | string[])[] = [];

  for (const output of featuredOutputs) {
    listItems.push(`${output.ruleCount} rules for **${output.readmeLabel}**`);

    const perPlugin = filter(
      map(output.plugins, (plugin) => {
        return 0 < plugin.ruleCount
          ? `${plugin.ruleCount} ${1 >= plugin.ruleCount ? "rule" : "rules"} from [${plugin.name}](${plugin.url})`
          : null;
      }),
      Boolean,
    ) as string[];

    listItems.push([
      isNil(output.readmeImport) ? "" : `\`${output.readmeImport}\``,
      ...perPlugin,
    ]);
  }

  md.unorderedList(listItems);
```

Also delete the `countRules` helper function (it's no longer needed — replaced by `output.ruleCount` and `plugin.ruleCount`).

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm --filter @ethang/eslint-config exec vitest run src/build/update-readme.test.ts
```

Expected: PASS

- [ ] **Step 5: Lint and type-check**

```bash
pnpm eslint packages/eslint-config/src/build/update-readme.ts packages/eslint-config/src/build/update-readme.test.ts --fix
pnpm --filter @ethang/eslint-config exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add packages/eslint-config/src/build/update-readme.ts packages/eslint-config/src/build/update-readme.test.ts
git commit -m "refactor(eslint-config): simplify update-readme to iterate outputConfigs"
```

---

### Task 11: Update build.ts

**Files:** `build.ts`

- [ ] **Step 1: Replace hardcoded configFiles with registry-derived list**

In `build.ts`, replace:

```ts
const configFiles = [
  "src/config.main.js",
  "src/config.html.js",
  "src/config.astro.js",
  "src/config.react.js",
  "src/config.solid.js",
  "src/config.angular.js",
  "src/config.storybook.js",
  "src/config.tailwind.js",
  "src/config.vitest.js",
];
```

with:

```ts
import { outputConfigs } from "./src/build/output-config.ts";

const configFiles = outputConfigs.map((c) => {
  return `src/${c.fileName}`;
});
```

Also update the tailwind type file check to use the OutputConfig:

```ts
for (const configFile of configFiles) {
  let distributionFile = replace(configFile, "src", "dist");
  distributionFile = replace(distributionFile, ".js", ".d.ts");

  const isTailwind = configFile === "src/config.tailwind.js";

  if (isTailwind) {
    writeFileSync(distributionFile, tailwindTypeFile);
  } else {
    writeFileSync(distributionFile, typeFile);
  }
}
```

- [ ] **Step 2: Lint and type-check**

```bash
pnpm eslint packages/eslint-config/build.ts --fix
pnpm --filter @ethang/eslint-config exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add packages/eslint-config/build.ts
git commit -m "refactor(eslint-config): derive build entry list from outputConfigs registry"
```

---

### Task 12: Delete old files

- [ ] **Step 1: Delete the files**

```bash
rm packages/eslint-config/src/build/rule-list.ts
rm packages/eslint-config/src/build/list-utilities.ts
rm packages/eslint-config/src/build/list-utilities.test.ts
rm packages/eslint-config/src/build/create-config.ts
rm packages/eslint-config/src/build/create-config.test.ts
```

- [ ] **Step 2: Remove all imports of deleted files and retired types**

Search for any remaining references:

```bash
grep -r "rule-list\|list-utilities\|create-config\b\|ConfigFile\|RuleConfig\|ConfigOptions" packages/eslint-config/src --include="*.ts" -l
```

The types `ConfigFile` (from `update-rules.ts`), `RuleConfig` (from `rule-list.ts`), and `ConfigOptions` (from `create-config.ts`) are retired. Remove any import of these types from files that were not already rewritten in earlier tasks. If a file still uses one of these types in a function signature, replace it with the appropriate new type (`OutputConfig` or `Plugin`).

- [ ] **Step 3: Lint and type-check**

```bash
pnpm eslint packages/eslint-config/src --fix
pnpm --filter @ethang/eslint-config exec tsc --noEmit
```

- [ ] **Step 4: Run all tests**

```bash
pnpm --filter @ethang/eslint-config exec vitest run
```

Expected: all tests pass, no references to deleted files

- [ ] **Step 5: Commit**

```bash
git add -A packages/eslint-config/src/build/
git commit -m "refactor(eslint-config): delete rule-list, list-utilities, and create-config"
```

---

### Task 13: Snapshot tests for generated config files

Run the build to regenerate all config files, then write snapshot tests that lock in the generated output. Any future regression in generated config content will fail a snapshot.

**Files:**
- Create: `src/build/build-output.test.ts`

- [ ] **Step 1: Run the build to generate fresh config files**

```bash
pnpm --filter @ethang/eslint-config exec tsx build.ts
```

Expected: all `src/config.*.js` files are regenerated without errors

- [ ] **Step 2: Write snapshot tests**

Create `src/build/build-output.test.ts`:

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { outputConfigs } from "./output-config.ts";

const readConfig = (fileName: string) => {
  return readFileSync(
    path.join(import.meta.dirname, `../${fileName}`),
    "utf8",
  );
};

describe("generated config files", () => {
  for (const output of outputConfigs) {
    it(`config ${output.fileName} matches snapshot`, () => {
      expect(readConfig(output.fileName)).toMatchSnapshot();
    });
  }
});
```

- [ ] **Step 3: Run the snapshot tests to create initial snapshots**

```bash
pnpm --filter @ethang/eslint-config exec vitest run src/build/build-output.test.ts
```

Expected: PASS — snapshots are written to `src/build/__snapshots__/build-output.test.ts.snap`

- [ ] **Step 4: Verify snapshots look correct**

Open `src/build/__snapshots__/build-output.test.ts.snap` and confirm each snapshot contains valid ESLint flat config JS — imports at top, `defineConfig(...)` or `const config = (...) =>` at bottom, correct plugins and rules sections.

- [ ] **Step 5: Lint**

```bash
pnpm eslint packages/eslint-config/src/build/build-output.test.ts --fix
```

- [ ] **Step 6: Commit**

```bash
git add packages/eslint-config/src/build/build-output.test.ts packages/eslint-config/src/build/__snapshots__/
git commit -m "test(eslint-config): add snapshot tests for generated config files"
```

---

### Task 14: Final verification

- [ ] **Step 1: Run the full test suite**

```bash
pnpm --filter @ethang/eslint-config exec vitest run
```

Expected: all tests pass

- [ ] **Step 2: Run the full build end-to-end**

```bash
pnpm --filter @ethang/eslint-config exec tsx build.ts
```

Expected: all config files regenerated, README updated, dist files written without errors

- [ ] **Step 3: Lint the entire package**

```bash
pnpm --filter @ethang/eslint-config lint
```

Expected: no errors
