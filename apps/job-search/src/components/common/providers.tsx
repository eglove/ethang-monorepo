import { logger } from "@/lib/logger.ts";
import { mutationCache } from "@/lib/query/mutation-cache.ts";
import { ComputeEngine } from "@cortex-js/compute-engine";
import { HeroUIProvider } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useNavigate } from "@tanstack/react-router";
import constant from "lodash/constant";
import ms from "ms";
import { lazy } from "react";

const ONE_HOUR = ms("1 Hr");

export const computeEngine = new ComputeEngine();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ONE_HOUR,
      staleTime: ONE_HOUR,
    },
  },
  mutationCache,
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
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider
        navigate={(path) => {
          navigate({ to: path }).catch(logger.error);
        }}
      >
        <Outlet />
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </HeroUIProvider>
    </QueryClientProvider>
  );
};
