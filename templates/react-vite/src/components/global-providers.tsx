import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Outlet, useNavigate } from "@tanstack/react-router";
import constant from "lodash/constant";
import { lazy } from "react";

import { persister, queryClient } from "../lib/react-query.ts";

const QueryDevelopmentTools =
  "production" === import.meta.env.MODE
    ? constant(null)
    : lazy(async () => {
        return import("@tanstack/react-query-devtools").then((result) => {
          return {
            default: result.ReactQueryDevtools,
          };
        });
      });

const TanStackRouterDevtools =
  "production" === import.meta.env.MODE
    ? constant(null)
    : lazy(async () =>
        import("@tanstack/react-router-devtools").then((response) => ({
          default: response.TanStackRouterDevtools,
        })),
      );

export const GlobalProviders = () => {
  const navigate = useNavigate();

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <HeroUIProvider
        navigate={(url) => {
          // eslint-disable-next-line no-console,sonar/no-reference-error
          navigate({ to: url }).catch(console.error);
        }}
      >
        <ToastProvider />
        <Outlet />
      </HeroUIProvider>
      <TanStackRouterDevtools />
      <QueryDevelopmentTools />
    </PersistQueryClientProvider>
  );
};
