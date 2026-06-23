import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import startsWith from "lodash/startsWith.js";

import { getSessionToken } from "./auth.ts";
import { rpcServiceDispatch } from "./rpc.ts";

const verifySessionToken = async (
  sessionToken: string
): Promise<{ email: string; sub: string }> => {
  const userResponse = await fetch("https://auth.ethang.dev/verify", {
    headers: { "X-Token": sessionToken }
  });

  if (!userResponse.ok) {
    throw new Error("Unauthorized");
  }

  return userResponse.json();
};

const handleRpcRequest = async (
  request: Request,
  environment: Env
): Promise<Response> => {
  let sessionToken: string;

  try {
    sessionToken = await getSessionToken(request, environment);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  let verifiedUser: { email: string; sub: string };

  try {
    verifiedUser = await verifySessionToken(sessionToken);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    method: string;
    params: Record<string, unknown>;
    service: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { method, params, service } = body;

  if (isNil(method) || isNil(service)) {
    return new Response("Missing service or method", { status: 400 });
  }

  if ("ethang_courses" !== service && "ethang_rss" !== service) {
    return new Response("Invalid service or method", { status: 400 });
  }

  try {
    const result = await rpcServiceDispatch(environment, service, method, {
      ...params,
      sessionToken,
      userEmail: verifiedUser.email,
      userSub: verifiedUser.sub
    });
    return Response.json(result);
  } catch (error) {
    return new Response(
      isError(error) ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
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
