import type { PropsWithChildren } from "react";

import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import { HeroUIProvider } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

export const queryClient = new QueryClient();

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  const router = useRouter();

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider
        navigate={(url) => {
          attemptAsync(async () => {
            return router.navigate({ to: url });
          }).catch(globalThis.console.error);
        }}
        useHref={(url) => {
          return router.buildLocation({ to: url }).href;
        }}
      >
        {children}
      </HeroUIProvider>
    </QueryClientProvider>
  );
};
