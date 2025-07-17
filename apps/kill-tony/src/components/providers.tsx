import type { PropsWithChildren } from "react";

import { ApolloProvider } from "@apollo/client";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { useRouter } from "@tanstack/react-router";

import { apolloClient } from "../clients/apollo.ts";

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  const router = useRouter();

  return (
    <ApolloProvider client={apolloClient}>
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
        <ToastProvider />
      </HeroUIProvider>
    </ApolloProvider>
  );
};
