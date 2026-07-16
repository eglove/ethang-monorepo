import { SignInSchema as AppSignInSchema } from "@ethang/schemas/auth/sign-in-schema.ts";
import { SignUpSchema } from "@ethang/schemas/auth/sign-up-schema.ts";
import { VerifySchema } from "@ethang/schemas/auth/verify-schema.ts";
import { Effect, Option, Schema } from "effect";
import { Hono } from "hono";
import { cors } from "hono/cors";
import isNil from "lodash/isNil.js";

import type { UserCommand } from "./domain/user/commands.ts";

import { getDatabase } from "./get-database.ts";
import { carryUserAuthCommand } from "./infrastructure/user/aggregate.ts";
import { createPasswordService } from "./infrastructure/user/password-service.ts";
import { createUserRepo } from "./infrastructure/user/repo.ts";
import { createTokenService } from "./infrastructure/user/token-service.ts";

export type AuthContextObject = { Bindings: CloudflareBindings };

const AUTH_COOKIE_NAME = "ethang-auth-token";

const JSON_HEADERS = {
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN"
} as const;

const json = <T>(data: T, status: number) => {
  // v8 ignore next -- defensive guard: every call site passes a non-nil value
  return new Response(isNil(data) ? null : JSON.stringify(data), {
    headers: JSON_HEADERS,
    status
  });
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

const ONE_YEAR_MS = 31_536_000 * 1000;

const setAuthCookie = async (token: null | string) => {
  if (isNil(token)) {
    return;
  }
  // eslint-disable-next-line compat/compat
  await cookieStore.set({
    expires: Date.now() + ONE_YEAR_MS,
    name: AUTH_COOKIE_NAME,
    path: "/",
    sameSite: "none",
    value: token
  });
};

const app = new Hono<AuthContextObject>();
app.use("*", cors());

const VALIDATION_ERROR = "Validation failed";
const UNAUTHORIZED_ERROR = "Unauthorized";

app.post("/sign-up", async (context) => {
  const parsed = Schema.decodeUnknownOption(SignUpSchema)(
    await context.req.json()
  );
  if (Option.isNone(parsed)) {
    return json({ error: VALIDATION_ERROR }, 400);
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

  if ("error" in result) {
    return json({ error: result.error }, 500);
  }
  const response = json(result, 200);
  await setAuthCookie("sessionToken" in result ? result.sessionToken : null);
  return response;
});

app.post("/sign-in", async (context) => {
  const parsed = Schema.decodeUnknownOption(AppSignInSchema)(
    await context.req.json()
  );
  if (Option.isNone(parsed)) {
    return json({ error: VALIDATION_ERROR }, 400);
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
  const result = await Effect.runPromise(effect);

  if ("error" in result) {
    return json({ error: result.error }, 401);
  }
  const rsp = json(result, 200);
  await setAuthCookie("sessionToken" in result ? result.sessionToken : null);
  return rsp;
});

app.get("/verify", async (context) => {
  const token = context.req.raw.headers.get("X-Token");

  if (isNil(token)) {
    return json({ error: UNAUTHORIZED_ERROR }, 401);
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
  const result = await Effect.runPromise(effect);

  if ("error" in result) {
    return json({ error: result.error }, 401);
  }
  const payload = "payload" in result ? result.payload : result;
  return json(payload, 200);
});

app.post("/verify", async (context) => {
  const parsed = Schema.decodeUnknownOption(VerifySchema)(
    await context.req.json()
  );
  if (Option.isNone(parsed)) {
    return json({ error: VALIDATION_ERROR }, 400);
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
  const result = await Effect.runPromise(effect);

  if ("error" in result) {
    return json({ error: result.error }, 401);
  }
  return json(result, 200);
});

export { app };
export default app;
