import { PrismaD1 } from "@prisma/adapter-d1";

import { PrismaClient } from "../generated/prisma";

export const getPrismaClient = (environment: Env) => {
  const adapter = new PrismaD1(environment.DB);
  // @ts-expect-error ignore
  return new PrismaClient({ adapter, log: ["query"] });
};
