// eslint-disable-next-line react/naming-convention/filename
import { HeroUIProvider } from "@heroui/react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";

import { persister } from "../clients/react-query/persister.ts";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60,
    },
  },
});

export const Route = createRootRoute({
  component: () => {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <HeroUIProvider>
          <HeadContent />
          <Outlet />
        </HeroUIProvider>
      </PersistQueryClientProvider>
    );
  },
});
