import type { z } from "zod";

import {
  type DBSchema,
  type IndexNames,
  openDB,
  type StoreNames,
  type StoreValue,
} from "idb";
import forEach from "lodash/forEach.js";

export type GetIndexedDatabaseOptions<Schema extends DBSchema> = {
  stores: {
    indexes?: {
      keyPath: string | string[];
      name: IndexNames<Schema, StoreNames<Schema>>;
      options?: IDBIndexParameters;
    }[];
    optionalParameters?: IDBObjectStoreParameters;
    schema: z.ZodSchema<StoreValue<Schema, StoreNames<Schema>>>;
    storeName: StoreNames<Schema>;
  }[];
};

export const getIndexedDatabase = async <Schema extends DBSchema>(
  name: string,
  version: number,
  options: GetIndexedDatabaseOptions<Schema>,
) => {
  return openDB<Schema>(name, version, {
    upgrade(database) {
      forEach(options.stores, (store) => {
        const objectStore = database.createObjectStore(
          store.storeName,
          store.optionalParameters,
        );

        forEach(store.indexes, (index) => {
          objectStore.createIndex(index.name, index.keyPath, index.options);
        });
      });
    },
  });
};
