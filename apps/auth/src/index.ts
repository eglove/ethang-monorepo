import { signInSchema, signUpSchema } from "@ethang/schemas/auth/user.ts";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import convertToString from "lodash/toString.js";

import { getPrismaClient } from "./get-prisma-client.ts";
import {
  type AuthContextObject,
  AuthService,
} from "./services/auth-service.js";

const app = new Hono<AuthContextObject>();
app.use("*", cors());

app.post("/sign-up", zValidator("json", signUpSchema), async (context) => {
  const prisma = getPrismaClient(context);
  const authService = new AuthService(
    prisma,
    convertToString(context.env[AuthService.TOKEN_AUTH_KEY]),
  );
  const body = context.req.valid("json");

  const user = await authService.createUser(
    body.email,
    body.password,
    body.username,
  );

  if (isError(user)) {
    return createJsonResponse({ error: user.message }, "INTERNAL_SERVER_ERROR");
  }

  const response = createJsonResponse(user, "OK");

  if (!isNil(user.sessionToken)) {
    authService.setAuthCookie(response, user.sessionToken);
  }
  return response;
});

app.post("/sign-in", zValidator("json", signInSchema), async (context) => {
  const prisma = getPrismaClient(context);
  const authService = new AuthService(
    prisma,
    convertToString(context.env[AuthService.TOKEN_AUTH_KEY]),
  );
  const body = context.req.valid("json");

  const user = await authService.signIn(body.email, body.password);

  if (isError(user)) {
    return createJsonResponse({ error: user.message }, "UNAUTHORIZED");
  }

  const response = createJsonResponse(user, "OK");
  if (!isNil(user.sessionToken)) {
    authService.setAuthCookie(response, user.sessionToken);
  }
  return response;
});

app.get("/verify", async (context) => {
  const prisma = getPrismaClient(context);
  const authService = new AuthService(
    prisma,
    convertToString(context.env[AuthService.TOKEN_AUTH_KEY]),
  );

  const token = authService.getTokenFromCookie(context.req.raw.headers);

  if (isError(token)) {
    return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  const jwt = await authService.verifyToken(token);

  if (isError(jwt)) {
    return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  return createJsonResponse(jwt.payload, "OK");
});

export default app;
