import attempt from "lodash/attempt.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import { useSyncExternalStore } from "react";

type ListenerOptions = AddEventListenerOptions | EventListenerOptions;
type ListenerParameters = Parameters<typeof addEventListener>;

type LocalStorageStoreOptions = {
  defaultValue?: string;
  listenerOptions?: ListenerOptions;
};

const localStorageStore = (key: string, options?: LocalStorageStoreOptions) => {
  return {
    event: new Event(`useLocalStorage-${key}`),
    getServerSnapshot: () => {
      return options?.defaultValue ?? null;
    },
    getSnapshot: () => {
      const item = attempt(localStorage.getItem.bind(localStorage), key);

      if (isError(item)) {
        return null;
      }

      return item;
    },
    subscribe: (listener: ListenerParameters[1]) => {
      const controller = new AbortController();
      const { signal } = controller;

      addEventListener(`useLocalStorage-${key}`, listener, {
        signal,
        ...options?.listenerOptions,
      });

      return () => {
        controller.abort();
      };
    },
  };
};

type UseLocalStorageProperties = {
  defaultValue?: string;
  listenerOptions?: ListenerOptions;
};

export const useLocalStorage = (
  key: string,
  options?: UseLocalStorageProperties,
) => {
  const { event, getServerSnapshot, getSnapshot, subscribe } =
    localStorageStore(key, {
      defaultValue: options?.defaultValue,
      listenerOptions: options?.listenerOptions,
    });

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = (newValue: string) => {
    attempt(localStorage.setItem.bind(localStorage), key, newValue);
    dispatchEvent(event);
  };

  if (null === value && !isNil(options?.defaultValue)) {
    setValue(options.defaultValue);
  }

  return [value, setValue] as const;
};
