import type { getPrismaClient } from "./prisma-client";

export type Context = {
  env: Env;
  prisma: ReturnType<typeof getPrismaClient>;
  userId: string;
};
