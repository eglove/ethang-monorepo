// eslint-disable-next-line react/naming-convention/filename-extension
import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

export const createRouter = () =>
  createTanStackRouter({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    routeTree,
    scrollRestoration: true,
  });

declare module "@tanstack/react-router" {
  // @ts-expect-error https://tanstack.com/start/latest/docs/framework/react/build-from-scratch
  type Register = {
    router: ReturnType<typeof createRouter>;
  };
}
