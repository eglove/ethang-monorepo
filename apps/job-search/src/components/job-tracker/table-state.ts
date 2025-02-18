import { Store } from "@ethang/store/index.js";
import { useSyncExternalStore } from "react";

export type ApplicationTableFilter = (
  | "interviewing"
  | "noStatus"
  | "rejected"
)[];

export type Sorting = {
  direction: "asc" | "desc" | false;
  id: string;
};

export const applicationTableStore = new Store(
  {
    search: "",
    sorting: { direction: "desc", id: "applied" } as Sorting,
    tableFilters: [
      "noStatus",
      "interviewing",
      "rejected",
    ] as ApplicationTableFilter,
  },
  {
    localStorageKey: "applicationTableState",
    syncToLocalStorage: true,
  },
);

export const useApplicationTableStore = () =>
  useSyncExternalStore(
    (listener) => applicationTableStore.subscribe(listener),
    () => applicationTableStore.get(),
    () => applicationTableStore.get(),
  );

export const setSearch = (search: string) => {
  applicationTableStore.set((state) => {
    state.search = search;
  });
};

export const setSorting = (id: string) => {
  applicationTableStore.set((state) => {
    if (id === state.sorting.id) {
      state.sorting.direction =
        "desc" === state.sorting.direction ? "asc" : "desc";
    } else {
      state.sorting.id = id;
      state.sorting.direction = "desc";
    }
  });
};
