/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { readD1Migrations } from "@cloudflare/vitest-pool-workers";
import path from "node:path";

export async function setup(context: any) {
  const migrationsPath = path.join(import.meta.dirname, "migrations");
  const migrations = await readD1Migrations(migrationsPath);
  context.provide("migrations", migrations);
}
