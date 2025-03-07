import { logger } from "@/lib/logger.ts";
import { paypalProviderOptions } from "@/lib/paypal.ts";
import { HeroUIProvider } from "@heroui/react";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useNavigate } from "@tanstack/react-router";
import constant from "lodash/constant";
import ms from "ms";
import { ThemeProvider } from "next-themes";
import { lazy } from "react";

const ONE_HOUR = ms("1 Hr");

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ONE_HOUR,
      staleTime: ONE_HOUR,
    },
  },
});

export const ReactQueryDevtools =
  "production" === import.meta.env.MODE
    ? constant(null)
    : lazy(async () =>
        import(
          "@tanstack/react-query-devtools/build/modern/production.js"
        ).then((d) => ({
          default: d.ReactQueryDevtools,
        })),
      );

export const TanStackRouterDevtools =
  "production" === import.meta.env.MODE
    ? constant(null)
    : lazy(async () =>
        import("@tanstack/router-devtools").then((response) => ({
          default: response.TanStackRouterDevtools,
        })),
      );

export const Providers = () => {
  const navigate = useNavigate();

  return (
    <PayPalScriptProvider options={paypalProviderOptions}>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider
          navigate={(path) => {
            navigate({ to: path }).catch(logger.error);
          }}
        >
          <ThemeProvider enableSystem attribute="class">
            <Outlet />
            <TanStackRouterDevtools />
            <ReactQueryDevtools />
          </ThemeProvider>
        </HeroUIProvider>
      </QueryClientProvider>
    </PayPalScriptProvider>
  );
};
