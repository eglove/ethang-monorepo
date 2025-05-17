import { ClerkProvider } from "@clerk/clerk-react";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import { HeroUIProvider } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { lazy, type PropsWithChildren } from "react";

export const queryClient = new QueryClient();

const ReactQueryDevtoolsProduction = lazy(async () =>
  import("@tanstack/react-query-devtools/build/modern/production.js").then(
    (d) => ({
      default: d.ReactQueryDevtools,
    }),
  ),
);

const ReactRouterDevtoolsProduction = lazy(async () =>
  import("@tanstack/react-router-devtools").then((d) => ({
    default: d.TanStackRouterDevtools,
  })),
);

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  const router = useRouter();

  return (
    <ClerkProvider publishableKey="pk_test_d2VsY29tZS1lYWdsZS03OC5jbGVyay5hY2NvdW50cy5kZXYk">
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider
          navigate={(url, options) => {
            attemptAsync(async () => {
              // @ts-expect-error lib -> router compat
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              return router.navigate({ to: url, ...options });
            }).catch(globalThis.console.error);
          }}
          useHref={(url) => {
            return router.buildLocation({ to: url }).href;
          }}
        >
          {children}
        </HeroUIProvider>
        <ReactRouterDevtoolsProduction />
        <ReactQueryDevtoolsProduction />
      </QueryClientProvider>
    </ClerkProvider>
  );
};
