import type { PropsWithChildren } from "react";

import { ApolloProvider } from "@apollo/client";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useRouter } from "@tanstack/react-router";
import { del, get, set } from "idb-keyval";

import { apolloClient } from "../clients/apollo-client.ts";

const isDevelopment = "development" === import.meta.env.MODE;
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: isDevelopment ? 0 : 1000 * 60 * 60 * 24,
      networkMode: "offlineFirst",
      staleTime: isDevelopment ? 0 : 1000 * 60,
    },
  },
});

const persister = createAsyncStoragePersister({
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
    <ApolloProvider client={apolloClient}>
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
          <ToastProvider />
          {children}
        </HeroUIProvider>
      </PersistQueryClientProvider>
    </ApolloProvider>
  );
};
