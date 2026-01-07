import type { GraphQLResolveInfo } from "graphql/type";

import { PrismaSelect } from "@paljs/plugins";
import { PrismaD1 } from "@prisma/adapter-d1";

import { PrismaClient } from "../generated/prisma/client";

export const getPrismaClient = (environment: Env) => {
  const adapter = new PrismaD1(environment.DB);
  return new PrismaClient({ adapter });
};

export const prismaSelect = <TSelect>(
  info: GraphQLResolveInfo,
  defaultFields: Record<string, string[]>,
) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return new PrismaSelect(info, {
    // @ts-expect-error allow record
    defaultFields,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  }).value.select as TSelect;
};
