import { SignInSchema as AppSignInSchema } from "@ethang/schemas/auth/sign-in-schema.ts";
import { SignUpSchema } from "@ethang/schemas/auth/sign-up-schema.ts";
import { VerifySchema } from "@ethang/schemas/auth/verify-schema.ts";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { setCookieValue } from "@ethang/toolbelt/http/cookie.js";
import { Effect, Option, Schema } from "effect";
import { Hono } from "hono";
import { cors } from "hono/cors";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import isString from "lodash/isString.js";

import type { UserCommand } from "./domain/user/commands.ts";

import { getDatabase } from "./get-database.ts";
import { carryUserAuthCommand } from "./infrastructure/user/aggregate.ts";
import { createPasswordService } from "./infrastructure/user/password-service.ts";
import { createUserRepo } from "./infrastructure/user/repo.ts";
import { createTokenService } from "./infrastructure/user/token-service.ts";

export type AuthContextObject = { Bindings: CloudflareBindings };

const AUTH_COOKIE_NAME = "ethang-auth-token";

const hasSessionToken = (
  value: unknown
): value is { readonly sessionToken: null | string | undefined } => {
  return isObject(value) && "sessionToken" in value;
};

const handleAuthCommand = (
  command: UserCommand,
  context: { env: { DB: D1Database; "token-auth"?: string } }
) => {
  const database = getDatabase(context.env.DB);
  const tokenSecret = context.env["token-auth"] ?? "";
  return carryUserAuthCommand(
    command,
    createUserRepo(database),
    createPasswordService(),
    createTokenService(tokenSecret)
  );
};

const setAuthCookie = (
  response: Response,
  token: null | string | undefined
) => {
  if (isNil(token)) return;
  setCookieValue({
    config: {
      HttpOnly: false,
      "Max-Age": 31_536_000,
      Path: "/",
      SameSite: "None",
      Secure: true
    },
    cookieName: AUTH_COOKIE_NAME,
    cookieValue: token,
    response
  });
};

const app = new Hono<AuthContextObject>();
app.use("*", cors());

const VALIDATION_ERROR = "Validation failed";
const UNAUTHORIZED_ERROR = "Unauthorized";

app.post("/sign-up", async (context) => {
  const body: unknown = await context.req.json();

  const parsed = Schema.decodeUnknownOption(SignUpSchema)(body);
  if (Option.isNone(parsed)) {
    return createJsonResponse({ error: VALIDATION_ERROR }, "BAD_REQUEST");
  }

  const { email, password, username } = parsed.value;
  const command: UserCommand = {
    email,
    kind: "SignUp",
    password
  };
  if (!isNil(username)) {
    (command as Record<string, unknown>)["username"] = username;
  }

  const effect = Effect.catchAll(
    handleAuthCommand(command, context).pipe(Effect.andThen(Effect.succeed)),
    (error) => {
      return Effect.succeed({
        error: Error.isError(error) ? error.message : String(error)
      });
    }
  );
  const result = await Effect.runPromise(effect);

  if ("error" in result && isString(result.error)) {
    return createJsonResponse({ error: result.error }, "INTERNAL_SERVER_ERROR");
  }
  const response = createJsonResponse(result, "OK");
  setAuthCookie(response, hasSessionToken(result) ? result.sessionToken : null);
  return response;
});

app.post("/sign-in", async (context) => {
  const body: unknown = await context.req.json();

  const parsed = Schema.decodeUnknownOption(AppSignInSchema)(body);
  if (Option.isNone(parsed)) {
    return createJsonResponse({ error: VALIDATION_ERROR }, "BAD_REQUEST");
  }

  const { email, password } = parsed.value;

  const effect = Effect.catchAll(
    handleAuthCommand({ email, kind: "SignIn", password }, context).pipe(
      Effect.andThen(Effect.succeed)
    ),
    () => {
      return Effect.succeed({ error: UNAUTHORIZED_ERROR });
    }
  );
  const result = (await Effect.runPromise(effect)) as Record<string, unknown>;

  if (!isNil(result["error"])) {
    return createJsonResponse({ error: result["error"] }, "UNAUTHORIZED");
  }
  const rsp = createJsonResponse(result, "OK");
  setAuthCookie(rsp, hasSessionToken(result) ? result.sessionToken : null);
  return rsp;
});

app.get("/verify", async (context) => {
  const token = context.req.raw.headers.get("X-Token");

  if (null === token) {
    return createJsonResponse({ error: UNAUTHORIZED_ERROR }, "UNAUTHORIZED");
  }

  const database = getDatabase(context.env.DB);
  const tokenSecret = context.env["token-auth"];
  const repo = createUserRepo(database);
  const passwordService = createPasswordService();
  const tokenService = createTokenService(tokenSecret);

  const effect = Effect.catchAll(
    carryUserAuthCommand(
      { kind: "VerifyToken", token },
      repo,
      passwordService,
      tokenService
    ).pipe(Effect.andThen(Effect.succeed)),
    () => {
      return Effect.succeed({ error: UNAUTHORIZED_ERROR });
    }
  );
  const result = (await Effect.runPromise(effect)) as Record<string, unknown>;

  if (!isNil(result["error"])) {
    return createJsonResponse({ error: result["error"] }, "UNAUTHORIZED");
  }
  const payload = "payload" in result ? result["payload"] : result;
  return createJsonResponse(payload, "OK");
});

app.post("/verify", async (context) => {
  const body: unknown = await context.req.json();

  const parsed = Schema.decodeUnknownOption(VerifySchema)(body);
  if (Option.isNone(parsed)) {
    return createJsonResponse({ error: VALIDATION_ERROR }, "BAD_REQUEST");
  }

  const { email, password } = parsed.value;

  const effect = Effect.catchAll(
    handleAuthCommand(
      { email, kind: "ValidateCredentials", password },
      context
    ).pipe(Effect.andThen(Effect.succeed)),
    () => {
      return Effect.succeed({ error: UNAUTHORIZED_ERROR });
    }
  );
  const result = (await Effect.runPromise(effect)) as Record<string, unknown>;
  const error = isNil(result["error"]) ? undefined : result["error"];

  return isNil(error)
    ? createJsonResponse(result, "OK")
    : createJsonResponse({ error }, "UNAUTHORIZED");
});

export { app };
export default app;
