import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"] });

export default defineConfig({
  dbCredentials: {
    url: process.env.DATABASE_URL
  },
  dialect: "sqlite",
  out: "./drizzle",
  schema: "./src/db/schema.ts"
});
