import { NextUIProvider } from "@nextui-org/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import constant from "lodash/constant.js";
import { lazy, type PropsWithChildren } from "react";

import { queryClient } from "../clients/query";

const TanStackRouterDevtools =
    "production" === process.env.NODE_ENV
      ? constant(null)
      : lazy(async () => {
        return import("@tanstack/router-devtools").then((result) => {
          return {
            default: result.TanStackRouterDevtools,
          };
        });
      });

const QueryDevtools = "production" === process.env.NODE_ENV
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
    <QueryClientProvider client={queryClient}>
      <NextUIProvider navigate={(route) => {
        // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable,no-console
        navigate({ to: route }).catch(console.error);
      }}
      >
        {children}
      </NextUIProvider>
      <QueryDevtools />
      <TanStackRouterDevtools position="bottom-left" />
    </QueryClientProvider>
  );
};
