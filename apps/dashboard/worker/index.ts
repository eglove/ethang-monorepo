import { ApolloServer } from "@apollo/server";
import { startServerAndCreateCloudflareWorkersHandler } from "@as-integrations/cloudflare-workers";
import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import startsWith from "lodash/startsWith";

import type { Context } from "./types.ts";

import { contactRouter } from "./contacts/contact-router.ts";
import { paths } from "./paths.ts";
import { getPrismaClient } from "./prisma-client.ts";
import { questionAnswerRouter } from "./question-answers/question-answer-router.ts";
import { rootResolver } from "./resolvers/root-resolver.ts";
import { todoRouter } from "./todos/todo-router.ts";
import { typeDefs } from "./typedefs.ts";
import { getIsAuthenticated } from "./utilities/get-is-authenticated.ts";

const server = new ApolloServer<Context>({
  resolvers: rootResolver,
  typeDefs,
});

// @ts-expect-error adding context types
const handler = startServerAndCreateCloudflareWorkersHandler<Env>(server, {
  context: async ({ env, request }) => {
    const userId = await getIsAuthenticated(request);

    if (false === userId) {
      return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
    }

    const prisma = getPrismaClient(env);

    return { env, prisma, request, userId };
  },
});

export default {
  async fetch(request, environment, context) {
    const url = new URL(request.url);
    const userId = await getIsAuthenticated(request);
    const tlsVersion = request.cf?.tlsVersion;

    if ("TLSv1.2" !== tlsVersion && "TLSv1.3" !== tlsVersion) {
      return createJsonResponse(
        {
          error: "TLS version 1.2 or higher required.",
        },
        "BAD_REQUEST",
      );
    }

    if ("/graphql" === url.pathname) {
      return handler(request, environment, context);
    }

    if (false === userId) {
      return createJsonResponse({ error: "Unauthorized" }, "UNAUTHORIZED");
    }

    if (startsWith(url.pathname, paths.questionAnswer)) {
      return questionAnswerRouter(request, environment, userId);
    }

    if (startsWith(url.pathname, paths.contact)) {
      return contactRouter(request, environment, userId);
    }

    if (startsWith(url.pathname, paths.todo)) {
      return todoRouter(request, environment, userId);
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
