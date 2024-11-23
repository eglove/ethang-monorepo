import type { WebhookEvent } from "@clerk/backend";

import { httpRouter } from "convex/server";
import isNil from "lodash/isNil.js";
import { Webhook } from "svix";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const validateRequest = async (
  request: Request,
): Promise<null | WebhookEvent> => {
  const payloadString = await request.text();
  const svixHeaders = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
  };
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET ?? "");
  try {
    return wh.verify(payloadString, svixHeaders) as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
};

http.route({
  // eslint-disable-next-line max-statements
  handler: httpAction(async (context, request) => {
    const event = await validateRequest(request);

    if (isNil(event)) {
      return new Response("unknown error in clerk webhook", { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (event.type) {
      case "user.created": // intentional fallthrough
      case "user.updated": {
        await context.runMutation(internal.users.upsertFromClerk, {

          data: event.data,
        });
        break;
      }

      case "user.deleted": {
        const clerkUserId = event.data.id ?? "";
        await context.runMutation(
          internal.users.deleteFromClerk,

          { clerkUserId },
        );
        break;
      }

      default: {
        console.log("Ignored Clerk webhook event", event.type as string);
      }
    }

    return new Response(null, { status: 200 });
  }),
  method: "POST",
  path: "/clerk-users-webhook",
});

export default http;
