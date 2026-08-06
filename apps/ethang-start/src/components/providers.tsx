import type { PropsWithChildren } from "react";

import { LinkProvider, Theme } from "@astryxdesign/core";
import { QueryClientProvider } from "@tanstack/react-query";

import { getContext } from "../router.tsx";
import { nightowlTheme } from "../themes/nightowl.js";
import { HybridLink } from "./hybrid-link.tsx";

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <Theme mode="dark" theme={nightowlTheme}>
      <QueryClientProvider client={getContext().queryClient}>
        <LinkProvider component={HybridLink}>{children}</LinkProvider>
      </QueryClientProvider>
    </Theme>
  );
};
