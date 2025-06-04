import {
  type CreateJobApplication,
  type DeleteJobApplication,
  getAllApplicationsSchema,
  type UpdateJobApplication,
} from "@ethang/schemas/src/dashboard/application-schema.ts";
import { createUrl } from "@ethang/toolbelt/fetch/create-url";
import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { produce } from "immer";
import debounce from "lodash/debounce.js";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty.js";
import isError from "lodash/isError";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import toInteger from "lodash/toInteger";
import convertToString from "lodash/toString";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { z } from "zod";

import { queryClient } from "../components/providers.tsx";
import { formDateToIso } from "../utilities/form.ts";
import { toastError } from "../utilities/toast-error.ts";
import { queryKeys } from "./queries/queries.ts";

const defaultState = {
  applicationToUpdate: null as null | UpdateJobApplication,
  debouncedSearch: "",
  isCreateModalOpen: false,
  isUpdateModalOpen: false,
  maxRoundsCount: 0,
  nextPage: 2,
  page: 1,
  previousPage: 0,
  search: "",
  totalPages: 1,
};

type ApplicationStoreState = typeof defaultState;
const applicationPath = "/api/application";

const searchParametersSchema = z.object({
  page: z.string().optional(),
  search: z.string().optional(),
});

export class ApplicationStore {
  public get state() {
    return this._state;
  }
  private _state: ApplicationStoreState = defaultState;

  private readonly _subscribers = new Set<
    (state: ApplicationStoreState) => void
  >();

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

        if (response.ok) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allUserApplications(userId),
          });

          this.update((state) => {
            state.isCreateModalOpen = false;
          });
        } else {
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

        if (response.ok) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allUserApplications(userId),
          });
          onOk?.();
        } else {
          toastError(response);
        }
      },
    };
  }

  public getAll(userId = "") {
    this.prefetchPreviousPage(userId);
    this.prefetchNextPage(userId);

    const currentPageKeys = [
      userId,
      this.state.page,
      this.state.debouncedSearch,
    ] as const;

    return queryOptions({
      enabled: !isEmpty(userId),
      placeholderData: keepPreviousData,
      queryFn: async () => {
        const applications = await this.runQuery(...currentPageKeys);

        this.update((state) => {
          state.totalPages = toInteger(
            get(applications, ["pagination", "totalPages"]),
          );

          state.maxRoundsCount = Math.max(
            ...map(applications.data, (datum) => {
              return datum.interviewRounds.length;
            }),
          );
        });

        return applications;
      },
      queryKey: queryKeys.applications(...currentPageKeys),
    });
  }

  public setApplicationToUpdate(application: null | UpdateJobApplication) {
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

  public subscribe(callback: (state: ApplicationStoreState) => void) {
    this._subscribers.add(callback);

    return () => {
      this._subscribers.delete(callback);
    };
  }

  public updateApplication(userId?: string) {
    return {
      mutationFn: async (data: UpdateJobApplication) => {
        if (isNil(userId) || isEmpty(userId)) {
          return;
        }

        const response = await fetch(applicationPath, {
          body: JSON.stringify({
            ...data,
            applied: formDateToIso(data.applied),
            rejected: isNil(data.rejected)
              ? null
              : formDateToIso(data.rejected),
          }),
          method: "PUT",
        });

        if (response.ok) {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: queryKeys.allUserApplications(userId),
            }),
            queryClient.invalidateQueries({
              queryKey: queryKeys.stats(userId),
            }),
          ]);

          this.update((state) => {
            state.isUpdateModalOpen = false;
          });
        }
      },
    };
  }

  private notifySubscribers() {
    for (const callback of this._subscribers) {
      callback(this._state);
    }
  }

  private prefetchNextPage(userId: string) {
    const nextPageKeys = [
      userId,
      this.state.nextPage,
      this.state.debouncedSearch,
    ] as const;

    if (this.state.nextPage <= this.state.totalPages && !isEmpty(userId)) {
      queryClient
        .prefetchQuery({
          queryFn: async () => {
            return this.runQuery(...nextPageKeys);
          },
          queryKey: queryKeys.applications(...nextPageKeys),
        })
        .catch(toastError);
    }
  }

  private prefetchPreviousPage(userId: string) {
    const previousPageKeys = [
      userId,
      this.state.previousPage,
      this.state.debouncedSearch,
    ] as const;

    if (0 < this.state.previousPage && !isEmpty(userId)) {
      queryClient
        .prefetchQuery({
          queryFn: async () => {
            return this.runQuery(...previousPageKeys);
          },
          queryKey: queryKeys.applications(...previousPageKeys),
        })
        .catch(toastError);
    }
  }

  private async runQuery(userId: string, page: number, search: string) {
    if (isEmpty(userId)) {
      throw new Error("No user found");
    }

    const url = createUrl(applicationPath, {
      searchParams: {
        page: convertToString(page),
        search,
      },
      searchParamsSchema: searchParametersSchema,
      urlBase: globalThis.location.origin,
    });

    if (isError(url)) {
      throw new Error("Invalid URL");
    }

    const data = await fetchJson(url, getAllApplicationsSchema);

    if (isError(data)) {
      throw new Error("Failed to fetch applications");
    }

    return data;
  }

  private update(
    updater: (draft: ApplicationStoreState) => void,
    shouldNotify = true,
  ) {
    this._state = produce(this._state, updater);

    if (shouldNotify) {
      this.notifySubscribers();
    }
  }
}

export const applicationStore = new ApplicationStore();

export const useApplicationStore = <Selection>(
  selector: (snapshot: ApplicationStoreState) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean,
) => {
  return useSyncExternalStoreWithSelector(
    (listener) => {
      return applicationStore.subscribe(listener);
    },
    () => applicationStore.state,
    () => applicationStore.state,
    selector,
    isEqual,
  );
};
