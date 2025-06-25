import { signInSchema, signUpSchema } from "@ethang/schemas/auth/user.ts";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import { zValidator } from "@hono/zod-validator";
import { PrismaD1 } from "@prisma/adapter-d1";
import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwtVerify, SignJWT } from "jose";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import convertToString from "lodash/toString.js";

import { PrismaClient } from "../generated/prisma/client.ts";

const app = new Hono<{ Bindings: CloudflareBindings }>();
app.use("*", cors());

app.post("/sign-up", zValidator("json", signUpSchema), async (context) => {
  const adapter = new PrismaD1(context.env.DB);
  // @ts-expect-error bad types
  const prisma = new PrismaClient({ adapter });

  const body = context.req.valid("json");

  const hashedPassword = await attemptAsync(async () => {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(body.password, salt);
  });

  if (isError(hashedPassword)) {
    return createJsonResponse(
      { error: hashedPassword.message },
      "INTERNAL_SERVER_ERROR",
    );
  }

  const user = await attemptAsync(async () => {
    return prisma.user.create({
      data: {
        email: body.email,
        lastLoggedIn: new Date().toISOString(),
        password: hashedPassword,
        username: body.username,
      },
    });
  });

  if (isError(user)) {
    return createJsonResponse({ error: user.message }, "INTERNAL_SERVER_ERROR");
  }

  return createJsonResponse(
    { email: user.email, id: user.id, username: user.username },
    "OK",
  );
});

app.post("/sign-in", zValidator("json", signInSchema), async (context) => {
  const adapter = new PrismaD1(context.env.DB);
  // @ts-expect-error bad types
  const prisma = new PrismaClient({ adapter });
  const body = context.req.valid("json");

  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (isNil(user)) {
    return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  const compared = await bcrypt.compare(body.password, user.password);

  if (!compared) {
    return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  const rehashed = await attemptAsync(async () => {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(body.password, salt);
  });

  if (isError(rehashed)) {
    return createJsonResponse({ error: "Failed to sign in" }, "UNAUTHORIZED");
  }

  const updatedUser = await attemptAsync(async () => {
    return prisma.user.update({
      data: { lastLoggedIn: new Date().toISOString(), password: rehashed },
      where: { email: user.email },
    });
  });

  if (isError(updatedUser)) {
    return createJsonResponse({ error: "Failed to sign in" }, "UNAUTHORIZED");
  }

  const token = await attemptAsync(async () => {
    const secretKey = new TextEncoder().encode(
      convertToString(context.env["token-auth"]),
    );

    return new SignJWT({
      email: updatedUser.email,
      role: updatedUser.role,
      sub: updatedUser.id,
      username: updatedUser.username,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .sign(secretKey);
  });

  if (isError(token)) {
    return createJsonResponse({ error: token.message }, "UNAUTHORIZED");
  }

  return createJsonResponse({ token, userId: user.id }, "OK");
});

app.get("/verify", async (context) => {
  const token = context.req.header("Authorization");

  if (isNil(token)) {
    return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  const secretKey = new TextEncoder().encode(
    convertToString(context.env["token-auth"]),
  );

  const verification = await attemptAsync(async () => {
    return jwtVerify(token, secretKey);
  });

  if (isError(verification)) {
    return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
  }

  return createJsonResponse(verification.payload, "OK");
});

export default app;
