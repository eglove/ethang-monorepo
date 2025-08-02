import { BaseStore } from "@ethang/store";
import debounce from "lodash/debounce.js";
import toInteger from "lodash/toInteger";

import type { FetchedApplication } from "../graphql/queries/get-all-applications.ts";

const defaultState = {
  applicationToUpdate: null as FetchedApplication | null,
  debouncedSearch: "",
  isCreateModalOpen: false,
  isUpdateModalOpen: false,
  nextPage: 2,
  page: 1,
  previousPage: 0,
  search: "",
  totalPages: 1,
};

type ApplicationStoreState = typeof defaultState;

export class ApplicationStore extends BaseStore<ApplicationStoreState> {
  public constructor() {
    super(defaultState);
  }

  public setApplicationToUpdate(application: FetchedApplication | null) {
    this.update((state) => {
      state.applicationToUpdate = application;
    });
  }

  public setIsCreateModalOpen(isOpen: boolean) {
    this.update((state) => {
      state.isCreateModalOpen = isOpen;
    });
  }

  public setIsUpdateModalOpen(isOpen: boolean) {
    this.update((state) => {
      state.isUpdateModalOpen = isOpen;
    });
  }

  public setPage(value: number) {
    this.update((state) => {
      state.page = toInteger(value);
      state.nextPage = toInteger(value) + 1;
      state.previousPage = toInteger(value) - 1;
    });
  }

  public setSearch(value: string) {
    this.update((state) => {
      state.search = value;
    });

    debounce(() => {
      this.update((state) => {
        state.debouncedSearch = this.state.search;
      });
    }, 500)();
  }
}

export const applicationStore = new ApplicationStore();
