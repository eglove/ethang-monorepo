import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";

import type { Store } from "./store.js";

export const useStore = <T, Selection>(
  store: Store<T>,
  selector: (snapshot: T) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean
) => {
  return useSyncExternalStoreWithSelector(
    (listener) => {
      return store.subscribe(listener);
    },
    () => {
      return store.state;
    },
    () => {
      return store.state;
    },
    selector,
    isEqual
  );
};
