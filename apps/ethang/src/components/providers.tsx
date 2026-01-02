import type { PropsWithChildren } from "react";

import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import { HeroUIProvider } from "@heroui/react";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { keepPreviousData, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useRouter } from "@tanstack/react-router";
import { del, get, set } from "idb-keyval";
import attempt from "lodash/attempt.js";
import isError from "lodash/isError.js";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60,
      placeholderData: keepPreviousData,
      staleTime: 1000 * 60 * 60,
    },
  },
});

const persister = createAsyncStoragePersister({
  key: "REACT_QUERY_ETHANG_CACHE",
  storage: {
    async getItem(key) {
      return get(key);
    },
    async removeItem(key) {
      return del(key);
    },
    async setItem(key, value) {
      return set(key, value);
    },
  },
});

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  const router = useRouter();

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <HeroUIProvider
        useHref={(url) => {
          const urlObject = attempt(() => new URL(url));

          if (isError(urlObject)) {
            return router.buildLocation({ to: url }).href;
          }

          return url;
        }}
        navigate={(url) => {
          attemptAsync(async () => {
            const urlObject = attempt(() => new URL(url));

            if (isError(urlObject)) {
              return router.navigate({ to: url });
            }

            return url;
          }).catch(globalThis.console.error);
        }}
      >
        {children}
      </HeroUIProvider>
    </PersistQueryClientProvider>
  );
};
