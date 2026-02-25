import type { Context, Input } from "hono";

import { AsyncLocalStorage } from "node:async_hooks";

export type AppContext = {
  Bindings: CloudflareBindings;
  Variables: GlobalStore;
};

export type CloudflareContext<P extends string, I extends Input> = Context<
  AppContext,
  P,
  I
>;

type GlobalStore = {
  locale: string;
  pathname: string;
  timezone: string;
};

export const globalStore = new AsyncLocalStorage<GlobalStore>();
