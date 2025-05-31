import type { PropsWithChildren } from "react";

import { ClerkProvider } from "@clerk/clerk-react";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useRouter } from "@tanstack/react-router";
import { del, get, set } from "idb-keyval";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      networkMode: "offlineFirst",
      staleTime: 1000 * 60,
    },
  },
});
const isDevelopment = "development" === import.meta.env.MODE;

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

const publishableKey = isDevelopment
  ? "pk_test_d2VsY29tZS1lYWdsZS03OC5jbGVyay5hY2NvdW50cy5kZXYk"
  : // eslint-disable-next-line cspell/spellchecker
    "pk_live_Y2xlcmsuZXRoYW5nLmRldiQ";

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  const router = useRouter();

  return (
    <ClerkProvider
      experimental={{
        persistClient: true,
        rethrowOfflineNetworkErrors: false,
      }}
      publishableKey={publishableKey}
    >
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
    </ClerkProvider>
  );
};
