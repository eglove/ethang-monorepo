import type { GraphQLResolveInfo } from "graphql/type";

import get from "lodash/get.js";
import isNil from "lodash/isNil.js";

import type { ServerContext } from "./index.ts";

export type AuthUser = {
  email: string;
  id: string;
  lastLoggedIn: string;
  role: string;
  updatedAt: string;
  username: string;
};

export const verifyToken = async (
  token: string,
): Promise<AuthUser | undefined> => {
  try {
    const response = await fetch("https://auth.ethang.dev/verify", {
      headers: {
        Cookie: `ethang-auth-token=${token}`,
      },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch {
    return undefined;
  }

  return undefined;
};

export const authenticated = <
  TParent,
  TArguments,
  TContext extends ServerContext,
  TResult,
>(
  resolver: (
    parent: TParent,
    arguments_: TArguments,
    context: TContext,
    info: GraphQLResolveInfo,
  ) => Promise<TResult>,
) => {
  return async (
    parent: TParent,
    _arguments: TArguments,
    context: TContext,
    info: GraphQLResolveInfo,
  ): Promise<TResult> => {
    const user = get(context, ["user"]);

    if (isNil(user)) {
      throw new Error("Not Authenticated");
    }

    return resolver(parent, _arguments, context, info);
  };
};
