import { NextUIProvider } from "@nextui-org/react";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { Outlet } from "@tanstack/react-router";

import { QueryDevelopmentTools } from "../components/query-development-tools.ts";
import { RouterDevelopmentTools } from "../components/router-development-tools.ts";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60, // 1 minute
      staleTime: 1000 * 60,
    },
  },
});

const localStoragePersister = createSyncStoragePersister({
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  storage: globalThis.localStorage,
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
persistQueryClient({
  persister: localStoragePersister,
  queryClient,
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <NextUIProvider>
        <Outlet />
        <RouterDevelopmentTools />
        <QueryDevelopmentTools />
      </NextUIProvider>
    </QueryClientProvider>
  );
};

export default App;
