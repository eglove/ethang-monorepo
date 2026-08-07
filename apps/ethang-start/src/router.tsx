import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { routeTree } from "./routeTree.gen";

export function getContext() {
  const queryClient = new QueryClient();

  return {
    queryClient
  };
}

export function getRouter() {
  const context = getContext();

  const router = createTanStackRouter({
    context,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    routeTree,
    scrollRestoration: true
  });

  setupRouterSsrQueryIntegration({ queryClient: context.queryClient, router });

  return router;
}

declare module "@tanstack/react-router" {
  // @ts-expect-error global types
  type Register = {
    router: ReturnType<typeof getRouter>;
    server: {
      requestContext: {
        env: Env;
      };
    };
  };
}
