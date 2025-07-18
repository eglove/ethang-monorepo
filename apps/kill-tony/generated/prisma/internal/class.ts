
/* !!! This is code generated by Prisma. Do not edit directly. !!! */
/* eslint-disable */
// @ts-nocheck 
/**
 * WARNING: This is an internal file that is subject to change!
 *
 * 🛑 Under no circumstances should you import this file directly! 🛑
 *
 * Please import the `PrismaClient` class from the `client.ts` file instead.
 */

import * as runtime from "@prisma/client/runtime/wasm-compiler-edge"
import type * as Prisma from "./prismaNamespace.ts"


const config: runtime.GetPrismaClientConfig = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client"
    },
    "output": {
      "value": "C:\\Users\\glove\\projects\\ethang-monorepo\\apps\\kill-tony\\generated\\prisma",
      "fromEnvVar": null
    },
    "config": {
      "importFileExtension": "ts",
      "runtime": "cloudflare",
      "moduleFormat": "esm",
      "generatedFileExtension": "ts",
      "engineType": "client"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "windows",
        "native": true
      }
    ],
    "previewFeatures": [
      "driverAdapters",
      "queryCompiler"
    ],
    "sourceFilePath": "C:\\Users\\glove\\projects\\ethang-monorepo\\apps\\kill-tony\\prisma\\schema.prisma",
    "isCustomOutput": true
  },
  "relativePath": "../../prisma",
  "clientVersion": "6.12.0",
  "engineVersion": "8047c96bbd92db98a2abc7c9323ce77c02c89dbc",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "sqlite",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "generator client {\n  provider               = \"prisma-client\"\n  output                 = \"../generated/prisma\"\n  previewFeatures        = [\"driverAdapters\", \"queryCompiler\"]\n  generatedFileExtension = \"ts\"\n  importFileExtension    = \"ts\"\n  moduleFormat           = \"esm\"\n  runtime                = \"cloudflare\"\n}\n\ndatasource db {\n  provider = \"sqlite\"\n  url      = env(\"DATABASE_URL\")\n}\n\nmodel Episode {\n  number      Int      @id @unique\n  title       String\n  url         String\n  publishDate DateTime\n\n  guests              Appearance[] @relation(\"EpisodeGuests\")\n  regulars            Appearance[] @relation(\"EpisodeRegulars\")\n  goldenTicketCashIns Appearance[] @relation(\"EpisodeGoldenTicketCashIns\")\n  bucketPulls         Appearance[] @relation(\"EpisodeBucketPulls\")\n}\n\nmodel Appearance {\n  id           String  @id @default(uuid(7))\n  name         String  @unique\n  isHallOfFame Boolean @default(false)\n\n  guestsIn             Episode[] @relation(\"EpisodeGuests\")\n  regularsIn           Episode[] @relation(\"EpisodeRegulars\")\n  cashedGoldenTicketIn Episode[] @relation(\"EpisodeGoldenTicketCashIns\")\n  bucketPullsIn        Episode[] @relation(\"EpisodeBucketPulls\")\n}\n",
  "inlineSchemaHash": "120da51443d816e8c374c624784c6edfd4d7e75cabb1683b772c69a0f318ae9e",
  "copyEngine": true,
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "dirname": ""
}

config.runtimeDataModel = JSON.parse("{\"models\":{\"Episode\":{\"fields\":[{\"name\":\"number\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"title\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"url\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"publishDate\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"guests\",\"kind\":\"object\",\"type\":\"Appearance\",\"relationName\":\"EpisodeGuests\"},{\"name\":\"regulars\",\"kind\":\"object\",\"type\":\"Appearance\",\"relationName\":\"EpisodeRegulars\"},{\"name\":\"goldenTicketCashIns\",\"kind\":\"object\",\"type\":\"Appearance\",\"relationName\":\"EpisodeGoldenTicketCashIns\"},{\"name\":\"bucketPulls\",\"kind\":\"object\",\"type\":\"Appearance\",\"relationName\":\"EpisodeBucketPulls\"}],\"dbName\":null},\"Appearance\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"isHallOfFame\",\"kind\":\"scalar\",\"type\":\"Boolean\"},{\"name\":\"guestsIn\",\"kind\":\"object\",\"type\":\"Episode\",\"relationName\":\"EpisodeGuests\"},{\"name\":\"regularsIn\",\"kind\":\"object\",\"type\":\"Episode\",\"relationName\":\"EpisodeRegulars\"},{\"name\":\"cashedGoldenTicketIn\",\"kind\":\"object\",\"type\":\"Episode\",\"relationName\":\"EpisodeGoldenTicketCashIns\"},{\"name\":\"bucketPullsIn\",\"kind\":\"object\",\"type\":\"Episode\",\"relationName\":\"EpisodeBucketPulls\"}],\"dbName\":null}},\"enums\":{},\"types\":{}}")
config.engineWasm = undefined
config.compilerWasm = {
  getRuntime: async () => await import("./query_compiler_bg.js"),

  getQueryCompilerWasmModule: async () => {
    const { default: module } = await import("./query_compiler_bg.wasm")
    return module
  }
}

config.injectableEdgeEnv = () => ({
  parsed: {
    DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DATABASE_URL || undefined
  }
})
if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  runtime.Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}



export type LogOptions<ClientOptions extends Prisma.PrismaClientOptions> =
  'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never

export interface PrismaClientConstructor {
    /**
   * ## Prisma Client
   * 
   * Type-safe database client for TypeScript
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Episodes
   * const episodes = await prisma.episode.findMany()
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  new <
    ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
    U = LogOptions<ClientOptions>,
    ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs
  >(options?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>): PrismaClient<ClientOptions, U, ExtArgs>
}

/**
 * ## Prisma Client
 * 
 * Type-safe database client for TypeScript
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Episodes
 * const episodes = await prisma.episode.findMany()
 * ```
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */

export interface PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = LogOptions<ClientOptions>,
  ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): runtime.Types.Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): runtime.Types.Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): runtime.Types.Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => runtime.Types.Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): runtime.Types.Utils.JsPromise<R>


  $extends: runtime.Types.Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, runtime.Types.Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.episode`: Exposes CRUD operations for the **Episode** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Episodes
    * const episodes = await prisma.episode.findMany()
    * ```
    */
  get episode(): Prisma.EpisodeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.appearance`: Exposes CRUD operations for the **Appearance** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Appearances
    * const appearances = await prisma.appearance.findMany()
    * ```
    */
  get appearance(): Prisma.AppearanceDelegate<ExtArgs, ClientOptions>;
}

export function getPrismaClientClass(dirname: string): PrismaClientConstructor {
  config.dirname = dirname
  return runtime.getPrismaClient(config) as unknown as PrismaClientConstructor
}
