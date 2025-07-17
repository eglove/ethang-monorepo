import type { GraphQLResolveInfo } from "graphql/type";

import { getPrismaClient } from "../../prisma-client.ts";
import { getPrismaSelect } from "../../utilties.ts";

type AllKeys = keyof PrismaClient;
type Arguments =
  | {
      orderBy?: Record<string, "asc" | "desc">;
      where?: Record<string, boolean>;
    }
  | undefined;
type Method<T extends Tables> = keyof PrismaClient[T];
type PrismaClient = ReturnType<typeof getPrismaClient>;

type Tables = Exclude<AllKeys, `$${string}`>;

export const queryResolver = <T extends Tables>(
  table: T,
  method: Method<T>,
) => {
  return async (
    _: unknown,
    _arguments: Arguments,
    contextValue: { env: Env },
    info: GraphQLResolveInfo,
    // eslint-disable-next-line @typescript-eslint/require-await
  ) => {
    const prismaClient = getPrismaClient(contextValue.env);

    // @ts-expect-error allow odd typing
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
    return prismaClient[table][method]({
      ..._arguments,
      select: getPrismaSelect(info),
    });
  };
};
