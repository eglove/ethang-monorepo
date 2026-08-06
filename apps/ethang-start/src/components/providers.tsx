import type { PropsWithChildren } from "react";

import {
  type Link as AstryxLink,
  LinkProvider,
  Theme
} from "@astryxdesign/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { getContext } from "../router.tsx";
import { nightowlTheme } from "../themes/nightowl.js";

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <Theme mode="dark" theme={nightowlTheme}>
      <QueryClientProvider client={getContext().queryClient}>
        <LinkProvider
          component={(properties: Parameters<typeof AstryxLink>[0]) => {
            const url = properties.href ?? "#";

            return (
              <Link to={url} target={properties.target ?? "_self"}>
                {properties.children}
              </Link>
            );
          }}
        >
          {children}
        </LinkProvider>
      </QueryClientProvider>
    </Theme>
  );
};
