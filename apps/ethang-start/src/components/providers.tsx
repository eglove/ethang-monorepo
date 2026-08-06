import type { PropsWithChildren } from "react";

import { type Link as AstryxLink, LinkProvider } from "@astryxdesign/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { getContext } from "../router.tsx";

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <QueryClientProvider client={getContext().queryClient}>
      <LinkProvider
        component={(properties: Parameters<typeof AstryxLink>[0]) => {
          const url = properties.href ?? "#";

          return <Link to={url}>{properties.children}</Link>;
        }}
      >
        {children}
      </LinkProvider>
    </QueryClientProvider>
  );
};
