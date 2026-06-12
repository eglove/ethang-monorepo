import {
  bold,
  generateMarkdown,
  link,
  type ListItem,
  type MarkdownBlock
} from "@ethang/markdown-generator/markdown-generator.js";
import compact from "lodash/compact.js";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { writeFileSync } from "node:fs";
import path from "node:path";

import { outputConfigs } from "./output-config.ts";

export const updateReadme = () => {
  const [mainConfig] = outputConfigs;
  const coreRules = map(mainConfig?.plugins ?? [], (plugin) => {
    return {
      count: plugin.ruleCount,
      name: plugin.name,
      url: plugin.url
    };
  }).toSorted((a, b) => {
    return b.count - a.count;
  });

  const total = mainConfig?.ruleCount ?? 0;

  const ruleDocumentation = [`${total} rules.`];
  for (const list of coreRules) {
    /* v8 ignore start */
    if (0 < list.count) {
      ruleDocumentation.push(
        `${list.count} ${
          1 >= list.count ? "rule" : "rules"
        } from [${list.name}](${list.url})`
      );
    }
    /* v8 ignore stop */
  }

  const featuredOutputs = filter(outputConfigs, (c) => {
    return !isNil(c.readmeLabel);
  });

  const listItems: ListItem[] = [];

  for (const output of featuredOutputs) {
    const perPlugin = compact(
      map(output.plugins, (plugin) => {
        const ruleWord = 1 >= plugin.ruleCount ? "rule" : "rules";
        return `${plugin.ruleCount} ${ruleWord} from [${plugin.name}](${plugin.url})`;
      })
    );

    const children: ListItem[] = [];
    if (!isNil(output.readmeImport)) {
      children.push({ text: `\`${output.readmeImport}\`` });
    }
    for (const pluginText of perPlugin) {
      children.push({ text: pluginText });
    }

    listItems.push({
      children,
      text: `${output.ruleCount} rules for **${output.readmeLabel}**`
    });
  }

  const blocks: MarkdownBlock[] = [
    { level: 1, text: "Relentless Unapologetic", type: "header" },
    {
      text: link("View Config", "https://eslint-config-ethang.pages.dev/rules"),
      type: "text"
    },
    {
      alertType: "CAUTION",
      text: "Prettier is already included for styling!",
      type: "alert"
    },
    {
      items: map(ruleDocumentation, (text) => {
        return { text };
      }),
      type: "unorderedList"
    },
    { level: 2, text: "Add Even More", type: "header" },
    {
      items: listItems,
      type: "unorderedList"
    },
    { level: 2, text: "Install", type: "header" },
    {
      code: "pnpm i -D eslint @ethang/eslint-config",
      language: "powershell",
      type: "codeBlock"
    },
    {
      text: bold("Requires TypesScript and tsconfig.json at root directory."),
      type: "text"
    },
    { level: 2, text: "Config", type: "header" },
    { text: "In **eslint.config.ts**", type: "text" },
    {
      code: `import config from "@ethang/eslint-config/config.main.js";
import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";
import reactConfig from "@ethang/eslint-config/config.react.js"; // OPTIONAL
import tailwindConfig from "@ethang/eslint-config/config.tailwind.js"; // OPTIONAL
import htmlConfig from "@ethang/eslint-config/config.html.js"; // OPTIONAL

export default defineConfig(
  globalIgnores([]), // Ignored files apply to all following configs
  ...config,
  ...reactConfig,
  ...htmlConfig,
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
  }
);`,
      language: "js",
      type: "codeBlock"
    },
    { text: bold("Scripts"), type: "text" },
    {
      code: `"scripts": {
  "lint": "eslint . --fix"
}`,
      language: "json",
      type: "codeBlock"
    },
    { text: bold("Browserslist"), type: "text" },
    {
      text: "This config will also lint for browserslist features. [More info.](https://github.com/browserslist/browserslist)",
      type: "text"
    },
    {
      text: `It's recommended to use ${link(
        "browserslist-config-baseline",
        "https://github.com/web-platform-dx/browserslist-config-baseline"
      )}`,
      type: "text"
    },
    {
      code: "pnpm i -D browserslist-config-baseline",
      language: "powershell",
      type: "codeBlock"
    },
    {
      code: `"browserslist": [
  "extends browserslist-config-baseline",
  "current node"
],`,
      language: "json",
      type: "codeBlock"
    },
    {
      text: "Or a simpler config without an additional dependency.",
      type: "text"
    },
    {
      code: `"browserslist": [
  "defaults and fully supports es6-module",
  "current node"
],`,
      language: "json",
      type: "codeBlock"
    },
    { text: bold("Engines"), type: "text" },
    {
      code: `"engines": {
  "node": ">=24"
},`,
      language: "json",
      type: "codeBlock"
    }
  ];

  writeFileSync(
    path.join(import.meta.dirname, "../README.md"),
    generateMarkdown({ blocks }),
    "utf8"
  );
};

/* v8 ignore start */
if (process.argv[1] === import.meta.filename) {
  updateReadme();
}
/* v8 ignore stop */
