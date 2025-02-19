import { MarkdownGenerator } from "@ethang/markdown-generator/markdown-generator.js";
import filter from "lodash/filter.js";
import flow from "lodash/flow.js";
import isArray from "lodash/isArray.js";
import map from "lodash/map.js";
import values from "lodash/values.js";
import { writeFileSync } from "node:fs";
import path from "node:path";

import type { genRules } from "../setup/gen-rules.ts";

import { getList } from "./list-utilities.ts";

const getRuleCount = (rules: ReturnType<typeof genRules>) => {
  let count = 0;
  for (const value of values(rules)) {
    if ("error" === value || (isArray(value) && "error" === value[0])) {
      count += 1;
    }
  }

  return count;
};

const getImports = flow(
  (rules: ReturnType<typeof getList>) => {
    return filter(rules, (rule) => {
      return 0 < getRuleCount(rule.list);
    });
  },
  (filteredRules) => {
    return map(filteredRules, (rule) => {
      return `${getRuleCount(rule.list)} rules from [${rule.name}](${rule.url})`;
    });
  },
);

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

  const ruleDocumentation = [`${total} errored rules.`];
  for (const list of coreRules) {
    if (0 < list.count) {
      ruleDocumentation.push(
        `${list.count} ${
          1 >= list.count ? "rule" : "rules"
        } from [${list.name}](${list.url})`,
      );
    }
  }

  const astroRules = getList("astro");
  const reactRules = getList("react");
  const solidRules = getList("solid");
  const angularRules = getList("angular");
  const angularTemplateRules = getList("angular:template");

  let astroCount = 0;
  for (const astroRule of astroRules) {
    astroCount += getRuleCount(astroRule.list);
  }

  let reactCount = 0;
  for (const reactRule of reactRules) {
    reactCount += getRuleCount(reactRule.list);
  }

  let solidCount = 0;
  for (const solidRule of solidRules) {
    solidCount += getRuleCount(solidRule.list);
  }

  let angularCount = 0;
  for (const angularRule of [...angularRules, ...angularTemplateRules]) {
    angularCount += getRuleCount(angularRule.list);
  }

  md.unorderedList(ruleDocumentation);
  md.newLine();
  md.header(1, "Add Even More!", 2);
  md.unorderedList([
    `${angularCount} rules for **Angular**`,
    [
      '`import angularConfig from "@ethang/eslint-config/config.angular.js";`',
      getImports(angularRules),
      getImports(angularTemplateRules),
    ],
    `${astroCount} rules for **Astro**`,
    [
      '`import astroConfig from "@ethang/eslint-config/config.astro.js";`',
      getImports(astroRules),
    ],
    `${reactCount} rules for **React**`,
    [
      '`import reactConfig from "@ethang/eslint-config/config.react.js";`',
      getImports(reactRules),
    ],
    `${solidCount} rules for **Solid**`,
    [
      '`import solidConfig from "@ethang/eslint-config/config.solid.js";`',
      getImports(solidRules),
    ],
  ]);
  md.newLine();
  md.header(1, "Install", 2);
  md.inlineCode("pnpm i -D eslint typescript-eslint @ethang/eslint-config", 2);
  md.bold("Requires TypesScript and tsconfig.json at root directory.", 2);
  md.header(1, "Config", 2);
  md.text("In **eslint.config.js**", 2);
  md.codeBlock(
    `import config from "@ethang/eslint-config/eslint.config.js";
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
  }
);`,
    "js",
    2,
  );
  md.bold("Scripts", 2);
  md.codeBlock(
    `"scripts": {
  "lint": "eslint",
  "lint:fix": "eslint . --fix",
}`,
    "json",
    2,
  );
  md.bold("Browserslist", 2);
  md.text(
    "This config will also lint for browserslist features. Make sure to set this in package.json. [More info.](https://github.com/browserslist/browserslist)",
    2,
  );
  md.codeBlock(
    `"browserslist": [
  "defaults and fully supports es6-module",
  "maintained node versions"
]`,
    "json",
  );

  writeFileSync(
    path.join(import.meta.dirname, "../README.md"),
    md.render(),
    "utf8",
  );
};

updateReadme();
