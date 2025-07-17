import type { GraphQLResolveInfo } from "graphql/type";

import isNil from "lodash/isNil.js";

import { getPrismaClient } from "../../prisma-client.ts";
import { getPrismaSelect } from "../../utilties.ts";

type AllKeys = keyof PrismaClient;
type Method<T extends Tables> = keyof PrismaClient[T];
type PrismaClient = ReturnType<typeof getPrismaClient>;
type Tables = Exclude<AllKeys, `$${string}`>;

export const queryResolver = <T extends Tables>(
  table: T,
  method: Method<T>,
) => {
  return async (
    _: unknown,
    _arguments: unknown,
    contextValue: { env: Env },
    info: GraphQLResolveInfo,
    // eslint-disable-next-line @typescript-eslint/require-await
  ) => {
    const prismaClient = getPrismaClient(contextValue.env);

    // @ts-expect-error allow odd typing
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
    return prismaClient[table][method]({
      select: getPrismaSelect(info),
      where: isNil(_arguments) ? undefined : { ..._arguments },
    });
  };
};
