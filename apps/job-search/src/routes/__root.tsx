// eslint-disable-next-line react/naming-convention/filename
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import constant from "lodash/constant.js";
import { lazy } from "react";

const queryClient = new QueryClient();

const ReactQueryDevtools =
  "production" === import.meta.env.MODE
    ? constant(null)
    : lazy(async () =>
        import(
          "@tanstack/react-query-devtools/build/modern/production.js"
        ).then((d) => ({
          default: d.ReactQueryDevtools,
        })),
      );

const TanStackRouterDevtools =
  "production" === import.meta.env.MODE
    ? constant(null)
    : lazy(async () =>
        import("@tanstack/router-devtools").then((response) => ({
          default: response.TanStackRouterDevtools,
        })),
      );

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <TanStackRouterDevtools />
      <ReactQueryDevtools />
    </QueryClientProvider>
  ),
});
