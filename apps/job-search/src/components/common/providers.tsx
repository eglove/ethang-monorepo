import { logger } from "@/lib/logger.ts";
import { HeroUIProvider } from "@heroui/react";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Outlet, useNavigate } from "@tanstack/react-router";
import constant from "lodash/constant";
import ms from "ms";
import { lazy } from "react";

const ONE_HOUR = ms("1 Hr");

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ONE_HOUR,
      staleTime: ONE_HOUR,
    },
  },
});

const persister = createSyncStoragePersister({
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  storage: globalThis.localStorage,
});

export const ReactQueryDevtools =
  "production" === import.meta.env.MODE
    ? constant(null)
    : lazy(async () =>
        import(
          "@tanstack/react-query-devtools/build/modern/production.js"
        ).then((d) => ({
          default: d.ReactQueryDevtools,
        })),
      );

export const TanStackRouterDevtools =
  "production" === import.meta.env.MODE
    ? constant(null)
    : lazy(async () =>
        import("@tanstack/router-devtools").then((response) => ({
          default: response.TanStackRouterDevtools,
        })),
      );

export const Providers = () => {
  const navigate = useNavigate();

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <HeroUIProvider
        navigate={(path) => {
          navigate({ to: path }).catch(logger.error);
        }}
      >
        <Outlet />
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </HeroUIProvider>
    </PersistQueryClientProvider>
  );
};
