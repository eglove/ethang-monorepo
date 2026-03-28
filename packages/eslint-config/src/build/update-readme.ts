import { MarkdownGenerator } from "@ethang/markdown-generator/markdown-generator.js";
import compact from "lodash/compact.js";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import values from "lodash/values.js";
import { writeFileSync } from "node:fs";
import path from "node:path";

import type { genRules } from "../setup/gen-rules.ts";

import { getList } from "./list-utilities.ts";
import { outputConfigs } from "./output-config.ts";

const getRuleCount = (rules: ReturnType<typeof genRules>) => {
  let count = 0;
  for (const value of values(rules)) {
    if ("off" !== value) {
      count += 1;
    }
  }

  return count;
};

export const updateReadme = () => {
  const md = new MarkdownGenerator();
  md.header(1, "Relentless. Unapologetic.", 2);
  md.link("View Config", "https://eslint-config-ethang.pages.dev/rules", 2);
  md.alert("CAUTION", "Prettier is already included for styling!", 2);

  const coreRules = map(
    [
      ...getList("core"),
      ...getList("json"),
      ...getList("css"),
      ...getList("markdown"),
    ],
    (rules) => {
      return {
        ...rules,
        count: 0,
      };
    },
  );

  let total = 0;
  for (const list of coreRules) {
    const count = getRuleCount(list.list);
    total += count;
    list.count = count;
  }
  coreRules.sort((a, b) => {
    return b.count - a.count;
  });

  const ruleDocumentation = [`${total} rules.`];
  for (const list of coreRules) {
    /* v8 ignore start */
    if (0 < list.count) {
      ruleDocumentation.push(
        `${list.count} ${
          1 >= list.count ? "rule" : "rules"
        } from [${list.name}](${list.url})`,
      );
    }
    /* v8 ignore stop */
  }

  md.unorderedList(ruleDocumentation);
  md.newLine();
  md.header(1, "Add Even More!", 2);

  const featuredOutputs = filter(outputConfigs, (c) => {
    return !isNil(c.readmeLabel);
  });

  const listItems: (string | string[])[] = [];

  for (const output of featuredOutputs) {
    listItems.push(`${output.ruleCount} rules for **${output.readmeLabel}**`);

    const perPlugin = compact(
      map(output.plugins, (plugin) => {
        if (0 >= plugin.ruleCount) {
          return null;
        }

        const ruleWord = 1 >= plugin.ruleCount ? "rule" : "rules";
        return `${plugin.ruleCount} ${ruleWord} from [${plugin.name}](${plugin.url})`;
      }),
    );

    listItems.push([
      isNil(output.readmeImport) ? "" : `\`${output.readmeImport}\``,
      ...perPlugin,
    ]);
  }

  md.unorderedList(listItems);
  md.newLine();
  md.header(1, "Install", 2);
  md.codeBlock("pnpm i -D eslint @ethang/eslint-config", "powershell", 2);
  md.bold("Requires TypesScript and tsconfig.json at root directory.", 2);
  md.header(1, "Config", 2);
  md.text("In **eslint.config.ts**", 2);
  md.codeBlock(
    `import config from "@ethang/eslint-config/config.main.js";
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
    "js",
    2,
  );
  md.bold("Scripts", 2);
  md.codeBlock(
    `"scripts": {
  "lint": "eslint . --fix"
}`,
    "json",
    2,
  );
  md.bold("Browserslist", 2);
  md.text(
    "This config will also lint for browserslist features. [More info.](https://github.com/browserslist/browserslist)",
    2,
  );
  md.text("It's recommended to use ");
  md.link(
    "browserslist-config-baseline",
    "https://github.com/web-platform-dx/browserslist-config-baseline",
    2,
  );
  md.codeBlock("pnpm i -D browserslist-config-baseline", "powershell", 2);

  md.codeBlock(
    `"browserslist": [
  "extends browserslist-config-baseline",
  "current node"
],`,
    "json",
    2,
  );

  md.text("Or a simpler config without an additional dependency.", 2);

  md.codeBlock(
    `"browserslist": [
  "defaults and fully supports es6-module",
  "current node"
],`,
    "json",
    2,
  );

  md.bold("Engines", 2);
  md.codeBlock(
    `"engines": {
  "node": ">=24"
},`,
    "json",
  );

  writeFileSync(
    path.join(import.meta.dirname, "../README.md"),
    md.render(),
    "utf8",
  );
};

/* v8 ignore start */
if (process.argv[1] === import.meta.filename) {
  updateReadme();
}
/* v8 ignore stop */
