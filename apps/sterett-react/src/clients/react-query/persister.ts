import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";

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
