import type { PropsWithChildren } from "react";

import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import { HeroUIProvider } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import attempt from "lodash/attempt.js";
import isError from "lodash/isError.js";

const queryClient = new QueryClient();

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  const router = useRouter();

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider
        useHref={(url) => {
          const urlObject = attempt(() => new URL(url));

          if (isError(urlObject)) {
            return router.buildLocation({ to: url }).href;
          }

          return url;
        }}
        navigate={(url) => {
          attemptAsync(async () => {
            const urlObject = attempt(() => new URL(url));

            if (isError(urlObject)) {
              return router.navigate({ to: url });
            }

            return url;
          }).catch(globalThis.console.error);
        }}
      >
        {children}
      </HeroUIProvider>
    </QueryClientProvider>
  );
};
