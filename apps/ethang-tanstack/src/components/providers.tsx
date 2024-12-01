/* eslint-disable react-compiler/react-compiler */
import type { PropsWithChildren } from "react";

import { environment } from "@/environment.ts";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ThemeProvider } from "@ethang/react-components/src/components/theme/theme-provider.tsx";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools/build/modern/production.js";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { convex } from "../clients/convex.ts";
import { persister, queryClient } from "../clients/query";

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <ClerkProvider publishableKey={environment.VITE_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk
        client={convex}
        useAuth={useAuth}
      >
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
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
