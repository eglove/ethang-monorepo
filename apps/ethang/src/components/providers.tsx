import type { PropsWithChildren } from "react";

import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "@tanstack/react-router";

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  const router = useRouter();

  return (
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
  );
};
