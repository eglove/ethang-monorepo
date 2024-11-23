import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { del, get, set } from "idb-keyval";

import { convexQueryClient } from "./convex.ts";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      queryFn: convexQueryClient.queryFn(),
      queryKeyHashFn: convexQueryClient.hashFn(),
    },
  },
});

convexQueryClient.connect(queryClient);

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
