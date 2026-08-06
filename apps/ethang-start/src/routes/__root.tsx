import type { QueryClient } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

import { TanStackDevtools } from "@tanstack/react-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { Providers } from "../components/providers.tsx";
import appCss from "../style.css?url";

type MyRouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => {
    return {
      links: [
        {
          href: appCss,
          rel: "stylesheet"
        }
      ],
      meta: [
        {
          charSet: "utf8"
        },
        {
          content: "width=device-width, initial-scale=1",
          name: "viewport"
        },
        {
          title: "EthanG"
        }
      ]
    };
  },
  server: { middleware: [] },
  shellComponent: RootDocument
});

function RootDocument({ children }: Readonly<PropsWithChildren>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <Providers>
          {children}
          <TanStackDevtools
            config={{
              position: "bottom-right"
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />
              }
            ]}
          />
          <Scripts />
        </Providers>
      </body>
    </html>
  );
}
