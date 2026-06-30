import { signUpSchema, verifySchema } from "@ethang/schemas/auth/user.ts";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { setCookieValue } from "@ethang/toolbelt/http/cookie.js";
import { zValidator } from "@hono/zod-validator";
import { Effect } from "effect";
import { Hono } from "hono";
import { cors } from "hono/cors";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";

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

const handleAuthCommand = async (
  command: UserCommand,
  context: { env: { DB: D1Database; "token-auth"?: string } }
) => {
  const database = getDatabase(context.env.DB);
  const tokenSecret = context.env["token-auth"] ?? "";
  const repo = createUserRepo(database);
  const passwordService = createPasswordService();
  const tokenService = createTokenService(tokenSecret);

  return Effect.runPromise(
    carryUserAuthCommand(command, repo, passwordService, tokenService)
  );
};

const setAuthCookie = (response: Response, token: null | string) => {
  if (null !== token) {
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
  }
};

const getErrorMessage = (error: unknown): string => {
  if (isError(error)) {
    return error.message;
  }
  return String(error);
};

const app = new Hono<AuthContextObject>();
app.use("*", cors());

app.post("/sign-up", zValidator("json", signUpSchema), async (context) => {
  const body = context.req.valid("json");

  const command: UserCommand = {
    email: body.email,
    kind: "SignUp",
    password: body.password,
    ...(!isNil(body.username) && { username: body.username })
  };

  let result;
  try {
    result = await handleAuthCommand(command, context);
  } catch (error) {
    return createJsonResponse(
      { error: getErrorMessage(error) },
      "INTERNAL_SERVER_ERROR"
    );
  }

  const sessionToken = hasSessionToken(result) ? result.sessionToken : null;
  const response = createJsonResponse(result, "OK");
  setAuthCookie(response, sessionToken ?? null);
  return response;
});

app.post("/sign-in", zValidator("json", signUpSchema), async (context) => {
  const body = context.req.valid("json");

  const command: UserCommand = {
    email: body.email,
    kind: "SignIn",
    password: body.password
  };

  let result;
  try {
    result = await handleAuthCommand(command, context);
  } catch {
    return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  const sessionToken = hasSessionToken(result) ? result.sessionToken : null;
  const response = createJsonResponse(result, "OK");
  setAuthCookie(response, sessionToken ?? null);
  return response;
});

app.get("/verify", async (context) => {
  const token = context.req.raw.headers.get("X-Token");

  if (null === token) {
    return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  const database = getDatabase(context.env.DB);
  const tokenSecret = context.env["token-auth"];
  const repo = createUserRepo(database);
  const passwordService = createPasswordService();
  const tokenService = createTokenService(tokenSecret);

  const command: UserCommand = {
    kind: "VerifyToken",
    token
  };

  let verifiedResult;
  try {
    verifiedResult = await Effect.runPromise(
      carryUserAuthCommand(command, repo, passwordService, tokenService)
    );
  } catch {
    return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  const verifiedPayload =
    "payload" in verifiedResult ? verifiedResult.payload : verifiedResult;
  return createJsonResponse(verifiedPayload, "OK");
});

app.post("/verify", zValidator("json", verifySchema), async (context) => {
  const body = context.req.valid("json");

  const command: UserCommand = {
    email: body.email,
    kind: "ValidateCredentials",
    password: body.password
  };

  try {
    const result = await handleAuthCommand(command, context);
    return createJsonResponse(result, "OK");
  } catch {
    return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }
});

export { app };
export default app;
