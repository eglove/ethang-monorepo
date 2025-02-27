import type {
  DBSchema,
  IDBPDatabase,
  IndexNames,
  StoreKey,
  StoreNames,
} from "idb";
import type { IndexKey } from "idb/build/entry.js";

import find from "lodash/find.js";
import forEach from "lodash/forEach.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import { z } from "zod";

import { type FetchAndCacheMode, fetchOrCache } from "./fetch-or-cache.js";
import {
  getIndexedDatabase,
  type GetIndexedDatabaseOptions,
} from "./get-indexed-database.ts";

type FetchIdbOptions<Schema extends DBSchema> = {
  baseUrl: string;
  getAuthenticationToken: () => Promise<string | undefined>;
} & GetIndexedDatabaseOptions<Schema>;

type UrlSearch<Schema extends DBSchema> = {
  count?: number | undefined;
  indexName?: IndexNames<Schema, StoreNames<Schema>> | undefined;
  query?:
    | IDBKeyRange
    | IndexKey<
        Schema,
        StoreNames<Schema>,
        IndexNames<Schema, StoreNames<Schema>>
      >
    | null
    | StoreKey<Schema, StoreNames<Schema>>
    | undefined;
};

export class FetchIdb<Schema extends DBSchema> {
  private _database: IDBPDatabase<Schema> | undefined;
  private readonly _options: FetchIdbOptions<Schema>;

  public constructor(
    name: string,
    version: number,
    options: FetchIdbOptions<Schema>,
  ) {
    this.setDatabase(name, version, options);
    this._options = options;
  }

  public async add(...parameters: Parameters<IDBPDatabase<Schema>["add"]>) {
    if (isNil(this._database)) {
      return;
    }

    const [storeName, value, key] = parameters;
    const storeOptions = this.getStoreOptions(storeName);

    if (isNil(storeOptions)) {
      return;
    }

    const url = this.getUrl(storeName, { query: key });

    globalThis
      .fetch(url, {
        body: JSON.stringify(value),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
      .catch(globalThis.console.error);

    return this._database.add(storeName, value, key);
  }

  public async count(
    ...parameters: [
      ...Parameters<IDBPDatabase<Schema>["count"]>,
      mode?: FetchAndCacheMode,
    ]
  ) {
    if (isNil(this._database)) {
      return;
    }

    const [storeName, key, mode] = parameters;
    const storeOptions = this.getStoreOptions(storeName);

    if (isNil(storeOptions)) {
      return;
    }

    const url = this.getUrl(storeName, { query: key });

    return fetchOrCache({
      getCachedValue: async () => {
        return this._database?.count(storeName, key);
      },
      input: url,
      mode,
      schema: z.number(),
    });
  }

  public async countFromIndex(
    ...parameters: [
      ...Parameters<IDBPDatabase<Schema>["countFromIndex"]>,
      mode?: FetchAndCacheMode,
    ]
  ) {
    if (isNil(this._database)) {
      return;
    }

    const [storeName, indexName, key, mode] = parameters;
    const storeOptions = this.getStoreOptions(storeName);

    if (isNil(storeOptions)) {
      return;
    }

    const url = this.getUrl(storeName, { indexName, query: key });

    return fetchOrCache({
      getCachedValue: async () => {
        return this._database?.countFromIndex(storeName, indexName, key);
      },
      input: url,
      mode,
      schema: z.number(),
    });
  }

  public async delete(
    ...parameters: Parameters<IDBPDatabase<Schema>["delete"]>
  ) {
    if (isNil(this._database)) {
      return;
    }

    const [storeName, key] = parameters;
    const storeOptions = this.getStoreOptions(storeName);

    if (isNil(storeOptions)) {
      return;
    }

    const url = this.getUrl(storeName, { query: key });

    globalThis
      .fetch(url, {
        method: "DELETE",
      })
      .catch(globalThis.console.error);

    return this._database.delete(storeName, key);
  }

  public async get(
    ...parameters: [
      ...Parameters<IDBPDatabase<Schema>["get"]>,
      mode?: FetchAndCacheMode,
    ]
  ) {
    if (isNil(this._database)) {
      return;
    }

    const [storeName, query, mode] = parameters;
    const storeOptions = this.getStoreOptions(storeName);

    if (isNil(storeOptions)) {
      return;
    }

    const url = this.getUrl(storeName, { query });

    return fetchOrCache({
      getCachedValue: async () => {
        return this._database?.get(storeName, query);
      },
      input: url,
      mode,
      schema: storeOptions.schema,
      setCachedValue: async (value) => {
        if (isNil(value)) {
          return;
        }

        return this._database?.put(storeName, value);
      },
    });
  }

  public async getAll(
    ...parameters: [
      ...Parameters<IDBPDatabase<Schema>["getAll"]>,
      mode?: FetchAndCacheMode,
    ]
  ) {
    if (isNil(this._database)) {
      return;
    }

    const [storeName, query, count, mode] = parameters;
    const storeOptions = this.getStoreOptions(storeName);

    if (isNil(storeOptions)) {
      return;
    }

    const url = this.getUrl(storeName, { count, query });

    return fetchOrCache({
      getCachedValue: async () => {
        return this._database?.getAll(storeName, query, count);
      },
      input: url,
      mode,
      schema: z.array(storeOptions.schema),
      setCachedValue: async (value) => {
        if (isNil(value)) {
          return;
        }

        return Promise.all(
          map(value, async (item) => this._database?.put(storeName, item)),
        );
      },
    });
  }

  public async getAllFromIndex(
    ...parameters: [
      ...Parameters<IDBPDatabase<Schema>["getAllFromIndex"]>,
      mode?: FetchAndCacheMode,
    ]
  ) {
    if (isNil(this._database)) {
      return;
    }

    const [storeName, indexName, query, count, mode] = parameters;
    const storeOptions = this.getStoreOptions(storeName);

    if (isNil(storeOptions)) {
      return;
    }

    const url = this.getUrl(storeName, { count, indexName, query });

    return fetchOrCache({
      getCachedValue: async () => {
        return this._database?.getAllFromIndex(
          storeName,
          indexName,
          query,
          count,
        );
      },
      input: url,
      mode,
      schema: z.array(storeOptions.schema),
      setCachedValue: async (value) => {
        if (isNil(value)) {
          return;
        }

        return Promise.all(
          map(value, async (item) => this._database?.put(storeName, item)),
        );
      },
    });
  }

  public async getFromIndex(
    ...parameters: [
      ...Parameters<IDBPDatabase<Schema>["getFromIndex"]>,
      mode?: FetchAndCacheMode,
    ]
  ) {
    if (isNil(this._database)) {
      return;
    }

    const [storeName, indexName, query, mode] = parameters;
    const storeOptions = this.getStoreOptions(storeName);

    if (isNil(storeOptions)) {
      return;
    }

    const url = this.getUrl(storeName, { indexName, query });

    return fetchOrCache({
      getCachedValue: async () => {
        return this._database?.getFromIndex(storeName, indexName, query);
      },
      input: url,
      mode,
      schema: storeOptions.schema,
      setCachedValue: async (value) => {
        if (isNil(value)) {
          return;
        }

        return this._database?.put(storeName, value);
      },
    });
  }

  public pullAll() {
    if (isNil(this._database)) {
      return;
    }

    Promise.all(
      map(this._options.stores, async (store) => {
        const url = this.getUrl(store.storeName);

        return fetchOrCache({
          input: url,
          mode: "networkOnly",
          schema: store.schema,
        }).then((value) => {
          if (!isNil(value) && !isError(value)) {
            this._database
              ?.put(store.storeName, value)
              .catch(globalThis.console.error);
          }
        });
      }),
    ).catch(globalThis.console.error);
  }

  public pushAll() {
    const database = this._database;
    if (isNil(database)) {
      return;
    }

    Promise.all(
      map(this._options.stores, async (store) => {
        const url = this.getUrl(store.storeName);

        return database.getAll(store.storeName).then((records) => {
          forEach(records, (body) => {
            globalThis
              .fetch(url, {
                body: JSON.stringify(body),
                headers: {
                  "Content-Type": "application/json",
                },
                method: "PUT",
              })
              .catch(globalThis.console.error);
          });
        });
      }),
    ).catch(globalThis.console.error);
  }

  public async put(...parameters: Parameters<IDBPDatabase<Schema>["put"]>) {
    if (isNil(this._database)) {
      return;
    }

    const [storeName, value, key] = parameters;
    const storeOptions = this.getStoreOptions(storeName);

    if (isNil(storeOptions)) {
      return;
    }

    const url = this.getUrl(storeName, { query: key });

    globalThis
      .fetch(url, {
        body: JSON.stringify(value),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PUT",
      })
      .catch(globalThis.console.error);

    return this._database.put(storeName, value, key);
  }

  private getStoreOptions(storeName: StoreNames<Schema>) {
    return find(this._options.stores, (store) => store.storeName === storeName);
  }

  private getUrl(storeName: StoreNames<Schema>, search?: UrlSearch<Schema>) {
    const url = new URL(`/${String(storeName)}`, this._options.baseUrl);

    if (isString(search?.query)) {
      url.searchParams.set("key", search.query);
    }

    if (search?.query instanceof IDBKeyRange) {
      url.searchParams.set("lower", String(search.query.lower));
      url.searchParams.set("upper", String(search.query.upper));
      url.searchParams.set("lowerOpen", String(search.query.upperOpen));
      url.searchParams.set("upperOpen", String(search.query.lowerOpen));
    }

    if (!isNil(search?.count)) {
      url.searchParams.set("count", String(search.count));
    }

    if (!isNil(search?.indexName)) {
      url.searchParams.set("index", String(search.indexName));
    }

    return url;
  }

  private setDatabase(
    name: string,
    version: number,
    options: GetIndexedDatabaseOptions<Schema>,
  ) {
    getIndexedDatabase(name, version, options)
      .then((database) => {
        this._database = database;
      })
      .catch(globalThis.console.error);
  }
}
