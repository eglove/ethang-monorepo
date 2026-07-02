import { TokenSchema } from "@ethang/schemas/auth/token-schema.js";
import { Effect, Schema } from "effect";
import isNil from "lodash/isNil.js";
import startsWith from "lodash/startsWith.js";

import { getSessionToken } from "./auth.ts";
import { rpcServiceDispatch } from "./rpc.ts";

const verifySessionToken = (
  sessionToken: string
): Effect.Effect<{ email: string; sub: string }, Error> => {
  return Effect.gen(function* () {
    const userResponse = yield* Effect.tryPromise({
      catch: (error) => {
        return new Error(String(error));
      },
      try: async () => {
        return fetch("https://auth.ethang.dev/verify", {
          headers: { "X-Token": sessionToken }
        });
      }
    });

    if (!userResponse.ok) {
      return yield* Effect.fail(new Error("Unauthorized"));
    }

    return yield* Effect.tryPromise({
      catch: (error) => {
        return new Error(String(error));
      },
      try: async () => {
        return Schema.decodeUnknownPromise(TokenSchema)(
          await userResponse.json()
        );
      }
    });
  });
};

const parseJsonBody = (
  request: Request
): Effect.Effect<
  {
    method: string;
    params: Record<string, unknown>;
    service: string;
  },
  Response
> => {
  return Effect.tryPromise({
    catch: () => {
      return new Response("Invalid JSON body", { status: 400 });
    },
    try: async () => {
      return request.json();
    }
  });
};

const callRpcService = (
  environment: Env,
  service: string,
  method: string,
  parameters: Record<string, unknown>
): Effect.Effect<unknown, Response> => {
  return Effect.tryPromise({
    catch: (error) => {
      return new Response(
        Error.isError(error) ? error.message : "Internal Server Error",
        { status: 500 }
      );
    },
    try: async () => {
      return rpcServiceDispatch(environment, service, method, parameters);
    }
  });
};

const handleRpcRequest = async (
  request: Request,
  environment: Env
): Promise<Response> => {
  const sessionTokenResult = await Effect.runPromise(
    Effect.tryPromise({
      catch: () => {
        return new Error("Unauthorized");
      },
      try: async () => {
        return getSessionToken(request, environment);
      }
    }).pipe(
      Effect.catchAll(() => {
        return Effect.succeed(null as null | string);
      })
    )
  );

  if (null === sessionTokenResult) {
    return new Response("Unauthorized", { status: 401 });
  }

  const verifiedUserResult = await Effect.runPromise(
    verifySessionToken(sessionTokenResult).pipe(
      Effect.catchAll(() => {
        return Effect.succeed(null);
      })
    )
  );

  if (null === verifiedUserResult) {
    return new Response("Unauthorized", { status: 401 });
  }

  const bodyResult = await Effect.runPromise(
    parseJsonBody(request).pipe(
      Effect.catchAll((response) => {
        return Effect.succeed(response);
      })
    )
  );

  if (bodyResult instanceof Response) {
    return bodyResult;
  }

  const { method, params, service } = bodyResult;

  if (isNil(method) || isNil(service)) {
    return new Response("Missing service or method", { status: 400 });
  }

  if ("ethang_courses" !== service && "ethang_rss" !== service) {
    return new Response("Invalid service or method", { status: 400 });
  }

  const result = await Effect.runPromise(
    callRpcService(environment, service, method, {
      ...params,
      sessionToken: sessionTokenResult,
      userEmail: verifiedUserResult.email,
      userSub: verifiedUserResult.sub
    }).pipe(
      Effect.catchAll((response) => {
        return Effect.succeed(response);
      })
    )
  );

  if (result instanceof Response) {
    return result;
  }

  return Response.json(result);
};

export default {
  async fetch(request: Request, environment: Env) {
    const url = new URL(request.url);

    if ("POST" === request.method && startsWith(url.pathname, "/api/rpc")) {
      return handleRpcRequest(request, environment);
    }

    return new Response(null, { status: 404 });
  }
} satisfies ExportedHandler<Env>;
