import map from "lodash/map.js";

import { createConfigFile } from "./create-config-file.ts";
import { outputConfigs } from "./output-config.ts";

export const updateRules = async () => {
  await Promise.all(
    map(outputConfigs, async (config) => {
      return createConfigFile(config);
    }),
  );
};

/* v8 ignore start */
if (process.argv[1] === import.meta.filename) {
  await updateRules();
}
/* v8 ignore stop */
