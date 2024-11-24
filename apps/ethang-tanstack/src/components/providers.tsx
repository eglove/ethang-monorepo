import { ThemeProvider } from "@/components/theme-provider.tsx";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ConvexProvider } from "convex/react";
import constant from "lodash/constant.js";
import { lazy, type PropsWithChildren } from "react";

import { convex } from "../clients/convex.ts";
import { persister, queryClient } from "../clients/query";

const TanStackRouterDevtools =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    (import.meta as unknown as { env: { DEV: boolean } }).env.DEV
      ? lazy(async () => {
        return import("@tanstack/router-devtools").then((result) => {
          return {
            default: result.TanStackRouterDevtools,
          };
        });
      })
      : constant(null);

const QueryDevtools =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    (import.meta as unknown as { env: { DEV: boolean } }).env.DEV
      ? lazy(async () => {
        return import("@tanstack/react-query-devtools").then((result) => {
          return {
            default: result.ReactQueryDevtools,
          };
        });
      })
      : constant(null);

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <ConvexProvider client={convex}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <ThemeProvider
          defaultTheme="dark"
          storageKey="ui-theme"
        >
          {children}
          <QueryDevtools />
          <TanStackRouterDevtools position="bottom-left" />
        </ThemeProvider>
      </PersistQueryClientProvider>
    </ConvexProvider>
  );
};
