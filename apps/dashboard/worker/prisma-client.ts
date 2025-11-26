import { PrismaD1 } from "@prisma/adapter-d1";

import { PrismaClient } from "../generated/prisma/client";

export const getPrismaClient = (context: Env) => {
  const adapter = new PrismaD1(context.dashboard);
  return new PrismaClient({ adapter });
};
