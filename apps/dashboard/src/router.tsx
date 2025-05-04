import { createRouter as createTanstackSolidRouter } from "@tanstack/solid-router";

import { routeTree } from "./routeTree.gen";

export const createRouter = () =>
  createTanstackSolidRouter({
    defaultErrorComponent: (error) => <div>{error.error.stack}</div>,
    defaultPreload: "intent",
    defaultStaleTime: 5000,
    routeTree,
    scrollRestoration: true,
  });

export const router = createRouter();

declare module "@tanstack/solid-router" {
  // @ts-expect-error globals
  type Register = {
    router: ReturnType<typeof createRouter>;
  };
}
