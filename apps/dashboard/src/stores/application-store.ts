import type {
  CreateJobApplication,
  DeleteJobApplication,
  UpdateJobApplication,
} from "@ethang/schemas/dashboard/application-schema.ts";

import { BaseStore } from "@ethang/store";
import debounce from "lodash/debounce.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import toInteger from "lodash/toInteger";

import type { FetchedApplication } from "../queries/get-all-applications.ts";

import { queryClient } from "../components/providers.tsx";
import { queryKeys } from "../data/queries/queries.ts";
import { formDateToIso } from "../utilities/form.ts";
import { toastError } from "../utilities/toast-error.ts";

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
const applicationPath = "/api/application";

export class ApplicationStore extends BaseStore<ApplicationStoreState> {
  public constructor() {
    super(defaultState);
  }

  public createApplication(userId?: string) {
    return {
      mutationFn: async (data: CreateJobApplication) => {
        if (isNil(userId) || isEmpty(userId)) {
          throw new Error("Unauthorized");
        }

        const response = await globalThis.fetch(applicationPath, {
          body: JSON.stringify(data),
          method: "POST",
        });

        this.update((state) => {
          state.isCreateModalOpen = false;
        }, false);

        if (!response.ok) {
          toastError(response);
        }
      },
    };
  }

  public deleteApplication(userId?: string, onOk?: () => void) {
    return {
      mutationFn: async (application: DeleteJobApplication) => {
        if (isNil(userId)) {
          return;
        }

        const response = await globalThis.fetch(applicationPath, {
          body: JSON.stringify({
            id: application.id,
          }),
          method: "DELETE",
        });

        onOk?.();

        if (!response.ok) {
          toastError(response);
        }
      },
    };
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

  public updateApplication(userId?: string) {
    return {
      mutationFn: async (data: UpdateJobApplication) => {
        if (isNil(userId) || isEmpty(userId)) {
          return;
        }

        await fetch(applicationPath, {
          body: JSON.stringify({
            ...data,
            applied: formDateToIso(data.applied),
            dmSent:
              isNil(data.dmSent) || isEmpty(data.dmSent)
                ? null
                : formDateToIso(data.dmSent),
            rejected:
              isNil(data.rejected) || isEmpty(data.rejected)
                ? null
                : formDateToIso(data.rejected),
          }),
          method: "PUT",
        });

        await queryClient.invalidateQueries({
          queryKey: queryKeys.stats(userId),
        });

        this.update((state) => {
          state.isUpdateModalOpen = false;
        }, false);
      },
    };
  }
}

export const applicationStore = new ApplicationStore();
