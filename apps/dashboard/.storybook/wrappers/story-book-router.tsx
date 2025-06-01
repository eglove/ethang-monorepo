import type { PropsWithChildren } from "react";

import {
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

import { Providers } from "../../src/components/providers";

export const StoryBookRouter = ({ children }: Readonly<PropsWithChildren>) => {
  const route = createRootRoute({
    component: () => {
      return <Providers>{children}</Providers>;
    },
  });
  const router = createRouter({
    routeTree: route,
  });

  return <RouterProvider router={router} />;
};
