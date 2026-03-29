import fromPairs from "lodash/fromPairs.js";
import map from "lodash/map.js";

export const buildScriptManifest = (
  scriptIds: string[],
): Record<string, string> =>
  fromPairs(map(scriptIds, (id) => [id, `/scripts/${id}.client.js`]));
