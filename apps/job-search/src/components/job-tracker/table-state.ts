import type { SortDescriptor } from "@heroui/react";
import type { OnChangeFn } from "@tanstack/react-table";

import { Store } from "@tanstack/react-store";
import { produce } from "immer";

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
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  globalThis.localStorage.getItem("applicationTableState") ?? "null",
) as ApplicationFormStoreState) ?? {
  companyFilter: "",
  isShowingInterviewing: true,
  isShowingNoStatus: false,
  isShowingRejected: true,
  sorting: { direction: "desc", id: "applied" } as Sorting,
};

export const applicationFormStore = new Store(initialState, {
  updateFn: (previous) => {
    return (updater) => {
      const updatedState = updater(previous);

      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      globalThis.localStorage.setItem(
        "applicationTableState",
        JSON.stringify(updatedState),
      );

      return updatedState;
    };
  },
});

export const setCompanyFilter = (companyFilter: string) => {
  applicationFormStore.setState((state) => {
    return produce(state, (draft) => {
      draft.companyFilter = companyFilter;
    });
  });
};

export const setApplicationSorting: OnChangeFn<Sorting> = (sorting) => {
  applicationFormStore.setState((state) => {
    return produce(state, (draft) => {
      // @ts-expect-error it's fine
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      draft.sorting = sorting(draft.sorting) as Sorting;
    });
  });
};

export const toggleIsShowingInterviewing = () => {
  applicationFormStore.setState((state) => {
    return produce(state, (draft) => {
      draft.isShowingInterviewing = !draft.isShowingInterviewing;
    });
  });
};

export const toggleIsShowingRejected = () => {
  applicationFormStore.setState((state) => {
    return produce(state, (draft) => {
      draft.isShowingRejected = !draft.isShowingRejected;
    });
  });
};

export const toggleIsShowingNoStatus = () => {
  applicationFormStore.setState((state) => {
    return produce(state, (draft) => {
      draft.isShowingNoStatus = !draft.isShowingNoStatus;
    });
  });
};

export const setSorting = (id: string) => {
  applicationFormStore.setState((state) => {
    return produce(state, (draft) => {
      if (id === state.sorting.column) {
        draft.sorting.direction =
          "descending" === state.sorting.direction ? "ascending" : "descending";
      } else {
        draft.sorting.column = id;
        draft.sorting.direction = "descending";
      }
    });
  });
};
