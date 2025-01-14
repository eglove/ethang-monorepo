import { ruleList } from "./rule-list.ts";

export const getList = (type: string) => {
  return ruleList
    .filter((list) => {
      return list.type === type;
    })
    .sort((a, b) => {
      return (a.order ?? 0) - (b.order ?? 0);
    });
};

export const getTypeImportStrings = (type: string) => {
  return ruleList
    .filter((list) => {
      return list.type === type;
    })
    .map((item) => {
      return item.importString;
    })
    .filter(Boolean);
};

export const getListJson = (list: typeof ruleList) => {
  return list
    .map((list) => {
      return JSON.stringify(list.list).slice(1, -1);
    })
    .join(",");
};

export const getTypeLanguage = (type: string) => {
  switch (type) {
    case "json": {
      return "json/json";
    }

    case "jsonc": {
      return "json/jsonc";
    }

    case "json5": {
      return "json/json5";
    }

    default: {
      return;
    }
  }
};

export const getTypeFiles = (type: string) => {
  switch (type) {
    case "core": {
      return ["**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts}"];
    }

    case "markdown": {
      return ["**/*.md"];
    }

    case "json": {
      return ["**/*.json"];
    }

    case "jsonc": {
      return ["**/*.jsonc"];
    }

    case "json5": {
      return ["**/*.json5"];
    }

    case "react": {
      return ["**/*.{jsx,tsx}"];
    }

    case "astro": {
      return ["**/*.{astro}"];
    }

    case "solid": {
      return ["**/*.{jsx,tsx}"];
    }

    case "angular": {
      return ["**/*.ts"];
    }

    case "angular:template": {
      return ["**/*.html"];
    }

    default: {
      return [];
    }
  }
};

export const getListPlugins = (list: typeof ruleList) => {
  let pluginString = "";

  for (const item of list) {
    if (item.pluginName && item.pluginValue) {
      pluginString += `"${item.pluginName}": ${item.pluginValue},`;
    }
  }

  return pluginString;
};
