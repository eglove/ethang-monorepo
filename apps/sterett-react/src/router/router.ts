import { createRootRoute, createRouter } from "@tanstack/react-router";

import { indexRoute } from "../routes/home.tsx";
import Root from "../routes/root.tsx";

export const rootRoute = createRootRoute({
  component: Root,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  // @ts-expect-error allow unused
  type Register = {
    router: typeof router;
  };
}
