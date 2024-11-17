import type { PropsWithChildren } from "react";

import { ConvexQueryClient } from "@convex-dev/react-query";
import { NextUIProvider } from "@nextui-org/react";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { del, get, set } from "idb-keyval";
import ms from "ms";

const convex = new ConvexReactClient(
  // @ts-expect-error assume env vars
  (import.meta as unknown as { env: Record<string, string> })
  // @ts-expect-error assume env vars
    .env.VITE_CONVEX_URL,
);
const convexQueryClient = new ConvexQueryClient(convex);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ms("23h"),
      queryFn: convexQueryClient.queryFn(),
      queryKeyHashFn: convexQueryClient.hashFn(),
    },
  },
});

export const persister = createAsyncStoragePersister({
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

convexQueryClient.connect(queryClient);

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <ConvexProvider client={convex}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <NextUIProvider>
          {children}
        </NextUIProvider>
        <ReactQueryDevtools />
        <TanStackRouterDevtools position="bottom-left" />
      </PersistQueryClientProvider>
    </ConvexProvider>
  );
};
