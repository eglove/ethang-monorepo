import type { PropsWithChildren } from "react";

import { ThemeProvider } from "@/components/theme-provider.tsx";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools/build/modern/production.js";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ConvexProvider } from "convex/react";

import { convex } from "../clients/convex.ts";
import { persister, queryClient } from "../clients/query";

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
          <ReactQueryDevtools />
          <TanStackRouterDevtools position="bottom-left" />
        </ThemeProvider>
      </PersistQueryClientProvider>
    </ConvexProvider>
  );
};
