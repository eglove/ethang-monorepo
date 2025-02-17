import { Store } from "@ethang/store/src/index.ts";
import { useSyncExternalStore } from "react";

export type Sorting = {
  direction: "asc" | "desc" | false;
  id: string;
};

export const applicationFormStore = new Store(
  {
    isShowingInterviewing: true,
    isShowingNoStatus: false,
    isShowingRejected: true,
    search: "",
    sorting: { direction: "desc", id: "applied" } as Sorting,
    tableFilters: ["interviewing", "rejected"],
  },
  {
    localStorageKey: "applicationTableState",
    syncToLocalStorage: true,
  },
);

export const useApplicationFormStore = () =>
  useSyncExternalStore(
    (listener) => applicationFormStore.subscribe(listener),
    () => applicationFormStore.get(),
    () => applicationFormStore.get(),
  );

export const setSearch = (search: string) => {
  applicationFormStore.set((state) => {
    state.search = search;
  });
};

export const setSorting = (id: string) => {
  applicationFormStore.set((state) => {
    if (id === state.sorting.id) {
      state.sorting.direction =
        "desc" === state.sorting.direction ? "asc" : "desc";
    } else {
      state.sorting.id = id;
      state.sorting.direction = "desc";
    }
  });
};
