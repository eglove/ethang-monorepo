import { PrismaD1 } from "@prisma/adapter-d1";

import type { AuthContext } from "./services/auth-service.js";

import { PrismaClient } from "../generated/prisma/client.js";

export const getPrismaClient = (context: AuthContext) => {
  const adapter = new PrismaD1(context.env.DB);
  return new PrismaClient({ adapter, omit: { user: { password: true } } });
};
