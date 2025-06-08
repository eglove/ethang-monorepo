import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";

import type { BaseStore } from "./index.js";

export const useBaseStore = <State, Selection>(
  store: BaseStore<State>,
  selector: (snapshot: BaseStore<State>["state"]) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean,
) => {
  return useSyncExternalStoreWithSelector(
    (listener) => {
      return store.subscribe(listener);
    },
    () => store.state,
    () => store.state,
    selector,
    isEqual,
  );
};
