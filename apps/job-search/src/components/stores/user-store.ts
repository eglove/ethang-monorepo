import { Store } from "@ethang/store/index.js";
import { useSyncExternalStore } from "react";

export const userStore = new Store(
  {
    isSignedIn: false,
    lastSynced: null as null | string,
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

export const setLastSynced = () => {
  userStore.set((state) => {
    state.lastSynced = new Date().toISOString();
  });
};
