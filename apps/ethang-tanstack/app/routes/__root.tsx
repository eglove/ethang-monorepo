// eslint-disable-next-line react/naming-convention/filename
import type { ReactNode } from "react";

import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";

const RootDocument = ({ children }: Readonly<{ children: ReactNode }>) => (
  <html lang="en-US">
    <head>
      <HeadContent />
    </head>
    <body>
      {children}
      <Scripts />
    </body>
  </html>
);

const RootComponent = () => (
  <RootDocument>
    <Outlet />
  </RootDocument>
);

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        charSet: "utf8",
      },
      {
        content: "width=device-width, initial-scale=1",
        name: "viewport",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
  }),
});
