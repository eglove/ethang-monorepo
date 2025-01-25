import type { WebhookEvent } from "@clerk/backend";

import { httpRouter } from "convex/server";
import isNil from "lodash/isNil";
import { Webhook } from "svix";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const validateRequest = async (request: Request) => {
  const payload = await request.text();
  const svixHeaders = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
  };

  // @ts-expect-error import meta
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
  const wh = new Webhook(import.meta.env.CLERK_WEBHOOK_SECRET ?? "");

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return wh.verify(payload, svixHeaders) as WebhookEvent;
  } catch {
    return null;
  }
};

const handleClerkWebhook = httpAction(async (context, request) => {
  const event = await validateRequest(request);
  if (!event) {
    return new Response("Unknown error", { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (event.type) {
    case "user.created":
    case "user.updated": {
      await context.runMutation(internal.users.updateOrCreateUser, {
        clerkUser: event.data,
      });
      break;
    }

    case "user.deleted": {
      const { id } = event.data;
      if (!isNil(id)) {
        await context.runMutation(internal.users.deleteUser, { clerkId: id });
      }
      break;
    }

    default: {
      globalThis.console.log("ignored Clerk webhook event", event.type);
    }
  }
  return new Response(null, { status: 200 });
});

http.route({
  handler: handleClerkWebhook,
  method: "POST",
  path: "/clerk-users-webhook",
});

export default http;
