import { Store } from "@tanstack/react-store";
import { produce } from "immer";

export const userStore = new Store(
  {
    isSyncing: false,
  },
  {
    updateFn: (previous) => {
      return (updater) => {
        const updatedState = updater(previous);

        globalThis.localStorage.setItem(
          "userStore",
          JSON.stringify(updatedState),
        );

        return updatedState;
      };
    },
  },
);

export const setIsUserSyncing = (isSyncing: boolean) => {
  userStore.setState((state) => {
    return produce(state, (draft) => {
      draft.isSyncing = isSyncing;
    });
  });
};
