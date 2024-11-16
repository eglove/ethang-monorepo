import { NextUIProvider } from "@nextui-org/react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useNavigate } from "@tanstack/react-router";
import constant from "lodash/constant.js";
import { lazy, type PropsWithChildren } from "react";

import { persister, queryClient } from "../clients/query";

const TanStackRouterDevtools =
    "production" === (import.meta as unknown as { env: { NODE_ENV: string } }).env.NODE_ENV
      ? constant(null)
      : lazy(async () => {
        return import("@tanstack/router-devtools").then((result) => {
          return {
            default: result.TanStackRouterDevtools,
          };
        });
      });

const QueryDevtools = "production" === (import.meta as unknown as { env: { NODE_ENV: string } }).env.NODE_ENV
  ? constant(null)
  : lazy(async () => {
    return import("@tanstack/react-query-devtools").then((result) => {
      return {
        default: result.ReactQueryDevtools,
      };
    });
  });

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  const navigate = useNavigate();

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <NextUIProvider navigate={(route) => {
        // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable,no-console
        navigate({ to: route }).catch(console.error);
      }}
      >
        {children}
      </NextUIProvider>
      <QueryDevtools />
      <TanStackRouterDevtools position="bottom-left" />
    </PersistQueryClientProvider>
  );
};
