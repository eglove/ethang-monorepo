/* eslint-disable react-compiler/react-compiler */
import type { PropsWithChildren } from "react";

import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { NextUIProvider } from "@nextui-org/react";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { del, get, set } from "idb-keyval";
import isError from "lodash/isError";
import ms from "ms";
import { ToastContainer } from "react-toastify";

const convex = new ConvexReactClient(
  // @ts-expect-error assume env vars
  (import.meta as unknown as { env: Record<string, string> })
  // @ts-expect-error assume env vars
    .env.VITE_CONVEX_URL,
);
const convexQueryClient = new ConvexQueryClient(convex);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ms("23h"),
      queryFn: convexQueryClient.queryFn(),
      queryKeyHashFn: convexQueryClient.hashFn(),
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: {
    async getItem(key) {
      return get(key);
    },
    async removeItem(key) {
      return del(key);
    },
    async setItem(key, value) {
      return set(key, value);
    },
  },
});

convexQueryClient.connect(queryClient);

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  const navigate = useNavigate();

  return (
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    <ClerkProvider publishableKey={(import.meta as unknown as {
      env: Record<string, string>;
    }).env["VITE_CLERK_PUBLISHABLE_KEY"]!}
    >
      <ConvexProviderWithClerk
        client={convex}
        useAuth={useAuth}
      >
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister }}
        >
          <NextUIProvider navigate={(path) => {
            navigate({ to: path }).catch((error: unknown) => {
              if (isError(error)) {
                console.error(error);
              }
            });
          }}
          >
            {children}
            <ToastContainer position="bottom-right" />
          </NextUIProvider>
          <ReactQueryDevtools />
          <TanStackRouterDevtools position="bottom-left" />
        </PersistQueryClientProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
