import { ConvexQueryClient } from "@convex-dev/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { del, get, set } from "idb-keyval";
import { type PropsWithChildren, StrictMode } from "react";

import { environment } from "../environment.ts";

const convex = new ConvexReactClient(environment.VITE_CONVEX_URL);
const convexQueryClient = new ConvexQueryClient(convex);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: convexQueryClient.queryFn(),
      queryKeyHashFn: convexQueryClient.hashFn(),
    },
  },
});
convexQueryClient.connect(queryClient);

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

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <StrictMode>
      <ConvexProvider client={convex}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister }}
        >
          {children}
          <ReactQueryDevtools />
        </PersistQueryClientProvider>
      </ConvexProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </StrictMode>
  );
};
