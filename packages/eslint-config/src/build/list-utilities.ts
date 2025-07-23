import filter from "lodash/filter.js";
import flow from "lodash/flow.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import { ruleList } from "./rule-list.ts";

const filterRuleListByType = (type: string) => {
  return filter(ruleList, (list) => {
    return list.type === type;
  });
};

export const getList = flow(filterRuleListByType, (list) => {
  return list.sort((a, b) => {
    return (a.order ?? 0) - (b.order ?? 0);
  });
});

export const getTypeImportStrings = flow(
  filterRuleListByType,
  (list) =>
    map(list, (item) => {
      return item.importString;
    }),
  (list) => filter(list, Boolean),
);

export const getListJson = flow(
  (list: typeof ruleList) => {
    return map(list, (item) => {
      return JSON.stringify(item.list).slice(1, -1);
    });
  },
  (list) => list.join(","),
);

export const getTypeLanguage = (type: string) => {
  switch (type) {
    case "css": {
      return "css/css";
    }

    case "html": {
      return "html/html";
    }

    case "json": {
      return "json/json";
    }

    case "json5": {
      return "json/json5";
    }

    case "jsonc": {
      return "json/jsonc";
    }

    default: {
      return null;
    }
  }
};

export const getTypeFiles = (type: string) => {
  switch (type) {
    case "angular": {
      return "**/*.ts";
    }

    case "angular:template": {
      return "**/*.html";
    }

    case "astro": {
      return "**/*.{astro}";
    }

    case "core":
    case "tailwind": {
      return "**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}";
    }

    case "css": {
      return "**/*.css";
    }

    case "html": {
      return "**/*.html";
    }

    case "json": {
      return "**/*.json";
    }

    case "json5": {
      return "**/*.json5";
    }

    case "jsonc": {
      return "**/*.jsonc";
    }

    case "markdown": {
      return "**/*.md";
    }

    case "react": {
      return "**/*.{jsx,tsx}";
    }

    case "solid": {
      return "**/*.{jsx,tsx}";
    }

    case "storybook": {
      return "**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)";
    }

    default: {
      return "";
    }
  }
};

export const getListPlugins = (list: typeof ruleList) => {
  let pluginString = "";

  for (const item of list) {
    if (!isNil(item.pluginName) && !isNil(item.pluginValue)) {
      pluginString += `"${item.pluginName}": ${item.pluginValue},`;
    }
  }

  return pluginString;
};
