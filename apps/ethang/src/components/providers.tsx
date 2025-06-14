import type { PropsWithChildren } from "react";

import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import { HeroUIProvider } from "@heroui/react";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useRouter } from "@tanstack/react-router";
import { del, get, set } from "idb-keyval";

export const queryClient = new QueryClient();

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
        navigate={(url) => {
          attemptAsync(async () => {
            return router.navigate({ to: url });
          }).catch(globalThis.console.error);
        }}
        useHref={(url) => {
          return router.buildLocation({ to: url }).href;
        }}
      >
        {children}
      </HeroUIProvider>
    </PersistQueryClientProvider>
  );
};
