import { Store } from "@ethang/store/src/index.ts";
import { useSyncExternalStore } from "react";

export const userStore = new Store(
  {
    isSignedIn: false,
    isSyncing: false,
    token: "",
  },
  {
    localStorageKey: "userStore",
    syncToLocalStorage: true,
  },
);

export const useUserStore = () =>
  useSyncExternalStore(
    (listener) => userStore.subscribe(listener),
    () => userStore.get(),
    () => userStore.get(),
  );
