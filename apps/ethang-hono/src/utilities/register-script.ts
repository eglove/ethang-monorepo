import type { ScriptId } from "../generated/script-ids.ts";
import type { GlobalStore } from "../stores/global-store-properties.ts";

export const registerScript = (store: GlobalStore, ...ids: ScriptId[]) => {
  for (const id of ids) {
    store.scripts.add(id);
  }
};
