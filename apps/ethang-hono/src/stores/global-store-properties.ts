import type { Context, Input } from "hono";

import first from "lodash/first.js";
import isString from "lodash/isString.js";
import split from "lodash/split.js";

export type AppContext = {
  Bindings: CloudflareBindings;
  Variables: GlobalStoreProperties;
};

type GlobalStoreProperties = {
  locale: string;
  origin: string;
  pathname: string;
  timezone: string;
};

export class GlobalStore {
  public locale = "en-US";
  public origin = "https://ethang.dev";
  public pathname = "/";
  public timezone = "UTC";

  public setup<P extends string, I extends Input>(
    context: Context<AppContext, P, I>,
  ) {
    const { origin, pathname } = new URL(context.req.url);
    const cfTimezone = context.req.raw.cf?.timezone;
    const timezone = isString(cfTimezone) ? cfTimezone : "UTC";
    const locale =
      first(split(context.req.header("Accept-Language"), ",")) ?? "en-US";

    this.origin = origin;
    this.pathname = pathname;
    this.timezone = timezone;
    this.locale = locale;
  }
}

export const globalStore = new GlobalStore();
