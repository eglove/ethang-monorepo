import { LogQuerySchema } from "@ethang/schemas/logger/log-query-schema.ts";
import { LogIngestSchema } from "@ethang/schemas/logger/log-schema.ts";
import { and, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { DateTime, Option, Schema } from "effect";
import { Hono } from "hono";
import attempt from "lodash/attempt.js";
import includes from "lodash/includes.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import split from "lodash/split.js";

import { logs } from "./db/schema.ts";

type Bindings = {
  ADMIN_KEY: string;
  ALLOWED_ORIGINS: string;
  CLIENT_API_KEYS: SecretsStoreSecret | string;
  SERVER_API_KEYS: SecretsStoreSecret | string;
} & Omit<
  CloudflareBindings,
  "ADMIN_KEY" | "ALLOWED_ORIGINS" | "CLIENT_API_KEYS" | "SERVER_API_KEYS"
>;

export const app = new Hono<{ Bindings: Bindings }>();

const getSecretValue = async (secret: unknown): Promise<string> => {
  if (
    // eslint-disable-next-line lodash/prefer-lodash-typecheck
    "object" === typeof secret &&
    null !== secret &&
    "get" in secret &&
    // eslint-disable-next-line lodash/prefer-lodash-typecheck
    "function" === typeof secret.get
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return (secret as { get: () => Promise<string> }).get();
  }
  // eslint-disable-next-line lodash/prefer-lodash-typecheck
  return "string" === typeof secret ? secret : "";
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const isWithinRateLimit = (ip: string): boolean => {
  const now = DateTime.toEpochMillis(DateTime.unsafeNow());
  const limit = rateLimitMap.get(ip);
  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (100 <= limit.count) {
    return false;
  }
  limit.count += 1;
  return true;
};

const getDatabase = (environment: Bindings) => {
  return drizzle(environment.DB);
};

const checkApiKey = async (
  apiKey: string | undefined,
  environment: Bindings
): Promise<{ isAuthorized: boolean; isClientKey: boolean }> => {
  if (isNil(apiKey) || "" === apiKey) {
    return { isAuthorized: false, isClientKey: false };
  }
  const serverKeysString = await getSecretValue(environment.SERVER_API_KEYS);
  const clientKeysString = await getSecretValue(environment.CLIENT_API_KEYS);
  const serverKeys = split(serverKeysString, ",");
  const clientKeys = split(clientKeysString, ",");
  const isServerKey = includes(serverKeys, apiKey);
  const isClientKey = includes(clientKeys, apiKey);
  return {
    isAuthorized: isServerKey || isClientKey,
    isClientKey
  };
};

const isOriginAllowed = (
  origin: string | undefined,
  allowedOriginsString: string
): origin is string => {
  if (isNil(origin) || "" === origin) {
    return false;
  }
  const allowedOrigins = split(allowedOriginsString, ",");
  return includes(allowedOrigins, origin);
};

app.options("/log", (c) => {
  const origin = c.req.header("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (isOriginAllowed(origin, c.env.ALLOWED_ORIGINS)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return new Response(null, { headers, status: 204 });
});

app.post("/log", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  if (!isWithinRateLimit(ip)) {
    return c.json({ error: "Too Many Requests" }, 429);
  }

  const apiKey = c.req.header("x-api-key");
  const { isAuthorized, isClientKey } = await checkApiKey(apiKey, c.env);

  if (!isAuthorized) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const origin = c.req.header("Origin");
  if (isClientKey && !isOriginAllowed(origin, c.env.ALLOWED_ORIGINS)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const parseResult = Schema.decodeUnknownOption(LogIngestSchema)(body);
  if (Option.isNone(parseResult)) {
    return c.json({ details: String(parseResult), error: "Bad Request" }, 400);
  }

  const validatedData = parseResult.value;
  const database = getDatabase(c.env);

  try {
    await database
      .insert(logs)
      .values({
        environment: validatedData.environment,
        level: validatedData.level,
        message: validatedData.message,
        metadata: validatedData.metadata,
        serviceName: validatedData.serviceName,
        stack: validatedData.stack
      })
      .run();
  } catch {
    return c.json({ error: "Database error" }, 500);
  }

  const headers: Record<string, string> = {};
  if (isOriginAllowed(origin, c.env.ALLOWED_ORIGINS)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return c.json({ success: true }, 202, headers);
});

const buildConditions = (filters: LogQuerySchema) => {
  const conditions = [];

  if (!isNil(filters.level)) {
    conditions.push(eq(logs.level, filters.level as string));
  }
  if (!isNil(filters.serviceName)) {
    conditions.push(eq(logs.serviceName, filters.serviceName));
  }
  if (!isNil(filters.environment)) {
    conditions.push(eq(logs.environment, filters.environment));
  }
  if (!isNil(filters.startDate)) {
    conditions.push(gte(logs.timestamp, filters.startDate));
  }
  if (!isNil(filters.endDate)) {
    conditions.push(lte(logs.timestamp, filters.endDate));
  }

  return conditions;
};

const cleanLogRows = (results: (typeof logs.$inferSelect)[]) => {
  return map(results, ({ metadata, stack, ...rest }) => {
    return {
      ...rest,
      ...(!isNil(stack) && { stack }),
      ...(!isNil(metadata) && { metadata })
    };
  });
};

app.get("/logs", async (c) => {
  const adminKey = c.req.header("x-admin-key");
  if (isNil(adminKey) || "" === adminKey || adminKey !== c.env.ADMIN_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const queryParameters = c.req.query();
  const filters = attempt(() => {
    return Schema.decodeSync(LogQuerySchema)(queryParameters);
  });

  if (isError(filters)) {
    return c.json(
      { details: "Invalid query parameters", error: "Bad Request" },
      400
    );
  }

  const database = getDatabase(c.env);
  const conditions = buildConditions(filters);

  let query = database.select().from(logs).$dynamic();
  if (0 < conditions.length) {
    query = query.where(and(...conditions));
  }

  const limitNumber = filters.limit ?? 50;
  const limit = Math.min(limitNumber, 100);
  const offset = filters.offset ?? 0;

  try {
    const results = await query.limit(limit).offset(offset).all();
    return c.json({ logs: cleanLogRows(results) });
  } catch {
    return c.json({ error: "Database error" }, 500);
  }
});

export default app;
