import map from "lodash/map.js";
import { writeFileSync } from "node:fs";
import path from "node:path";

import type { ConfigFile } from "./update-rules.ts";

import { createConfig } from "./create-config.ts";
import { getTypeImportStrings } from "./list-utils.ts";

const mainFile = "eslint.config.js";

export const createConfigFile = async (
  listConfigs: ConfigFile[],
  fileName: string,
) => {
  let configFile = "// @ts-nocheck\n";

  const imports = listConfigs.flatMap((list) => {
    const importStrings = getTypeImportStrings(list.name);

    if (list.options?.extraImports && 0 < list.options.extraImports.length) {
      importStrings.push(...list.options.extraImports);
    }

    return importStrings;
  });

  // eslint-disable-next-line compat/compat
  const importList = [
    'import { ignores, languageOptions } from "./constants.js";',
    ...imports,
  ].toSorted((a, b) => {
    return (a ?? "").localeCompare(b ?? "");
  });

  for (const item of importList) {
    configFile += `${item}\n`;
  }

  const configs = await Promise.all(
    map(listConfigs, async (list) => {
      return createConfig(list.name, list.options);
    }),
  );

  configFile += `\nexport default tseslint.config(
    ${configs.join("\n")}
    ${mainFile === fileName ? "eslintConfigPrettier," : ""}
    ${mainFile === fileName ? "eslintPluginPrettierRecommended," : ""}
  );\n`;

  writeFileSync(
    path.join(import.meta.dirname, `../${fileName}`),
    configFile,
    "utf8",
  );
};
