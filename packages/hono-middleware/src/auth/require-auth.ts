import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import isError from "lodash/isError.js";

export type AuthConfig = {
  cookieName?: string;
  verifyUrl?: string;
};

export const requireAuth = (config?: AuthConfig) => {
  return createMiddleware(async (c, next) => {
    const cookieName = config?.cookieName ?? "ethang-auth-token";
    const verifyUrl = config?.verifyUrl ?? "https://auth.ethang.dev/verify";

    const token = getCookie(c, cookieName);

    if (token === undefined) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const result = await attemptAsync(async () => {
      const response = await fetch(verifyUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return new Error("Unauthorized");
      }

      const data: unknown = await response.json();

      c.set("user", data);
      return null;
    });

    if (isError(result)) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return next();
  });
};
