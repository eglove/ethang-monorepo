import { Effect } from "effect";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import isNil from "lodash/isNil.js";

export type AuthConfig = {
  cookieName?: string;
  verifyUrl?: string;
};

const UNAUTHORIZED = "Unauthorized";

const toError = (error: unknown) => {
  return Error.isError(error) ? error : new Error(String(error));
};

const fetchWithToken = (verifyUrl: string, token: string) => {
  return Effect.tryPromise({
    catch: toError,
    try: async () => {
      return fetch(verifyUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  });
};

const parseJson = (response: Response) => {
  return Effect.tryPromise({
    catch: toError,
    try: async () => {
      return response.json();
    }
  });
};

export const requireAuth = (config?: AuthConfig) => {
  return createMiddleware(async (c, next) => {
    const cookieName = config?.cookieName ?? "ethang-auth-token";
    const verifyUrl = config?.verifyUrl ?? "https://auth.ethang.dev/verify";

    const token = getCookie(c, cookieName);

    if (isNil(token)) {
      return c.json({ error: UNAUTHORIZED }, 401);
    }

    const verify = Effect.gen(function* () {
      const response = yield* fetchWithToken(verifyUrl, token);

      if (!response.ok) {
        return yield* Effect.fail(new Error(UNAUTHORIZED));
      }

      const data: unknown = yield* parseJson(response);
      c.set("user", data);
      return yield* Effect.succeed(null);
    });

    const exit = await Effect.runPromiseExit(verify);

    if ("Failure" === exit._tag) {
      return c.json({ error: UNAUTHORIZED }, 401);
    }

    return next();
  });
};
