import type { Context, Input } from "hono";

import { getCookieValue } from "@ethang/toolbelt/http/cookie.js";
import first from "lodash/first.js";
import isError from "lodash/isError.js";
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
  public authToken: null | string = null;
  public isAuthenticated = false;
  public locale = "en-US";
  public origin = "https://ethang.dev";
  public pathname = "/";
  public timezone = "UTC";
  public userId: null | string = null;

  public async setup<P extends string, I extends Input>(
    context: Context<AppContext, P, I>,
  ) {
    const { origin, pathname } = new URL(context.req.url);
    const cfTimezone = context.req.raw.cf?.timezone;
    const timezone = isString(cfTimezone) ? cfTimezone : "UTC";
    const locale =
      first(split(context.req.header("Accept-Language"), ",")) ?? "en-US";

    const token = getCookieValue("ethang-auth-token", context.req.raw.headers);

    this.origin = origin;
    this.pathname = pathname;
    this.timezone = timezone;
    this.locale = locale;

    if (!isError(token)) {
      await this.setAuthToken(token);
    }
  }

  private async setAuthToken(value: null | string) {
    await fetch("https://auth.ethang.dev/verify", {
      headers: {
        "X-Token": value ?? "",
      },
    })
      .then(async (response) => {
        if (response.ok) {
          this.authToken = value;
          this.isAuthenticated = true;
        } else {
          this.authToken = null;
          this.isAuthenticated = false;
        }

        return response.json<{ sub: string }>();
      })
      .then((_data) => {
        this.userId = _data.sub;
      })
      .catch(globalThis.console.error);
  }
}

export const globalStore = new GlobalStore();
