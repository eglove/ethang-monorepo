import { drizzle } from "drizzle-orm/sqlite-proxy";
import slice from "lodash/slice.js";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

import { databaseSchema } from "../../db/database-schema.ts";
import { subscriptionsQuery } from "./subscriptions.ts";

const tableSql = `
CREATE TABLE feeds (
  id text primary key,
  iconUrl text,
  lastFetchedAt text,
  title text not null,
  website text not null,
  xmlAddress text unique not null
);
CREATE TABLE subscriptions (
  id text primary key,
  userId text not null,
  feedId text not null,
  createdAt text
);
`;

const createDatabase = () => {
  const driver = new DatabaseSync(":memory:");
  driver.exec(tableSql);

  const query = async (
    sql: string,
    parameters: unknown[],
    method: "all" | "get" | "run" | "values"
  ) => {
    const statement = driver.prepare(sql);

    if ("run" === method) {
      statement.run(...(parameters as never[]));
      return { success: true };
    }

    const rows = statement
      .all(...(parameters as never[]))
      .map((row: Record<string, unknown>) => {
        return Object.values(row);
      });

    if ("get" === method) {
      return { rows: slice(rows, 0, 1) };
    }

    return { rows };
  };

  const orm = drizzle(query as never, {
    schema: databaseSchema
  }) as never;

  return { driver, orm };
};

describe("subscriptionsQuery - real SQLite execution", () => {
  it("returns the authenticated user's subscriptions with valid generated SQL", async () => {
    const { driver, orm } = createDatabase();
    driver.exec(
      `INSERT INTO feeds (id,title,website,xmlAddress)` +
        ` VALUES ('feed-1','My Feed','https://example.com','https://example.com/rss');`
    );
    driver.exec(
      `INSERT INTO subscriptions (id,userId,feedId,createdAt)` +
        ` VALUES ('sub-1','user-1','feed-1','2026-01-01T00:00:00.000Z');`
    );

    const result = await subscriptionsQuery(
      orm,
      {},
      { email: "u", exp: 0, iat: 0, sub: "user-1", username: "u" }
    );

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]?.node.title).toBe("My Feed");
    expect(result.edges[0]?.node.id).toBe("feed-1");
  });

  it("paginates through subscribed feeds using an after cursor", async () => {
    const { driver, orm } = createDatabase();
    driver.exec(
      `INSERT INTO feeds (id,title,website,xmlAddress) VALUES` +
        ` ('feed-1','My Feed','https://example.com','https://example.com/rss'),` +
        ` ('feed-2','Other Feed','https://other.com','https://other.com/rss');`
    );
    driver.exec(
      `INSERT INTO subscriptions (id,userId,feedId,createdAt) VALUES` +
        ` ('sub-1','user-1','feed-1','2026-01-01T00:00:00.000Z'),` +
        ` ('sub-2','user-1','feed-2','2026-01-02T00:00:00.000Z');`
    );

    const result = await subscriptionsQuery(
      orm,
      { after: "sub-0" },
      { email: "u", exp: 0, iat: 0, sub: "user-1", username: "u" }
    );

    expect(result.edges).toHaveLength(0);
  });
});
