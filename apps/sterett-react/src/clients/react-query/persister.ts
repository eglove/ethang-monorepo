import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";

import { del, get, set } from "idb-keyval";

const createPersister = (idbKey: IDBValidKey = "reactQuery"): Persister => {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(idbKey, client);
    },
    removeClient: async () => {
      await del(idbKey);
    },
    restoreClient: async () => {
      return get<PersistedClient>(idbKey);
    },
  };
};

export const persister = createPersister();
