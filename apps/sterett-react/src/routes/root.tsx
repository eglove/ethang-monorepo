import { NextUIProvider } from "@nextui-org/react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Outlet } from "@tanstack/react-router";

import { persister } from "../clients/react-query/persister.ts";
import { QueryDevelopmentTools } from "../components/query-development-tools.ts";
import { RouterDevelopmentTools } from "../components/router-development-tools.ts";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60,
    },
  },
});

const App = () => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <NextUIProvider>
        <Outlet />
        <RouterDevelopmentTools />
        <QueryDevelopmentTools />
      </NextUIProvider>
    </PersistQueryClientProvider>
  );
};

export default App;
