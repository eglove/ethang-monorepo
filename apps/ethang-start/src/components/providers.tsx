import type { PropsWithChildren } from "react";

import { QueryClientProvider } from "@tanstack/react-query";

import { getContext } from "../router.tsx";

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <QueryClientProvider client={getContext().queryClient}>
      {children}
    </QueryClientProvider>
  );
};
