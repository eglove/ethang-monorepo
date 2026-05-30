import { ApolloProvider } from "@apollo/client/react";
import { Theme } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";

import { apolloClient } from "../clients/apollo.ts";

export const queryClient = new QueryClient();

const RootLayout = () => {
  return (
    <ApolloProvider client={apolloClient}>
      <QueryClientProvider client={queryClient}>
        <Theme appearance="dark">
          <main className="mx-auto max-w-7xl p-4">
            <Outlet />
          </main>
        </Theme>
      </QueryClientProvider>
    </ApolloProvider>
  );
};

export const Route = createRootRoute({ component: RootLayout });
