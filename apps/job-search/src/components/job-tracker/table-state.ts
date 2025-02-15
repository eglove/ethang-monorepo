import type { SortDescriptor } from "@heroui/react";
import type { OnChangeFn } from "@tanstack/react-table";

import { Store } from "@ethang/store/src/index.ts";
import { useSyncExternalStore } from "react";

export type Sorting = {
  direction: "asc" | "desc" | false;
  id: string;
};

type ApplicationFormStoreState = {
  companyFilter: string;
  isShowingInterviewing: boolean;
  isShowingNoStatus: boolean;
  isShowingRejected: boolean;
  sorting: SortDescriptor;
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition,@typescript-eslint/no-unsafe-type-assertion
const initialState: ApplicationFormStoreState = (JSON.parse(
  globalThis.localStorage.getItem("applicationTableState") ?? "null",
) as ApplicationFormStoreState) ?? {
  companyFilter: "",
  isShowingInterviewing: true,
  isShowingNoStatus: false,
  isShowingRejected: true,
  sorting: { direction: "desc", id: "applied" } as Sorting,
};

export const applicationFormStore = new Store(initialState, {
  localStorageKey: "applicationTableState",
  syncToLocalStorage: true,
});

export const useApplicationFormStore = () =>
  useSyncExternalStore(
    (listener) => applicationFormStore.subscribe(listener),
    () => applicationFormStore.get(),
    () => applicationFormStore.get(),
  );

export const setCompanyFilter = (companyFilter: string) => {
  applicationFormStore.set((state) => {
    state.companyFilter = companyFilter;
  });
};

export const setApplicationSorting: OnChangeFn<Sorting> = (sorting) => {
  applicationFormStore.set((state) => {
    // @ts-expect-error it's fine
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    state.sorting = sorting(state.sorting) as Sorting;
  });
};

export const toggleIsShowingInterviewing = () => {
  applicationFormStore.set((state) => {
    state.isShowingInterviewing = !state.isShowingInterviewing;
  });
};

export const toggleIsShowingRejected = () => {
  applicationFormStore.set((state) => {
    state.isShowingRejected = !state.isShowingRejected;
  });
};

export const toggleIsShowingNoStatus = () => {
  applicationFormStore.set((state) => {
    state.isShowingNoStatus = !state.isShowingNoStatus;
  });
};

export const setSorting = (id: string) => {
  applicationFormStore.set((state) => {
    if (id === state.sorting.column) {
      state.sorting.direction =
        "descending" === state.sorting.direction ? "ascending" : "descending";
    } else {
      state.sorting.column = id;
      state.sorting.direction = "descending";
    }
  });
};
