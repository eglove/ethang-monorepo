import fromPairs from "lodash/fromPairs.js";
import map from "lodash/map.js";

export const buildScriptManifest = (
  scriptIds: string[]
): Record<string, string> => {
  return fromPairs(
    map(scriptIds, (id) => {
      return [id, `/scripts/${id}.client.js`];
    })
  );
};
