import { config } from "@dotenvx/dotenvx";
import { defineConfig, env } from "prisma/config";

config();

export default defineConfig({
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "migrations",
  },
  schema: "prisma/schema.prisma",
});
