import type { WebhookEvent } from "@clerk/backend";

import { httpRouter } from "convex/server";
import isNil from "lodash/isNil.js";
import { Webhook } from "svix";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const validateRequest = async (
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
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
    // eslint-disable-next-line no-console
    console.error("Error verifying webhook event", error);
    return null;
  }
};

http.route({
  // eslint-disable-next-line max-statements
  handler: httpAction(async (context, request) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const event = await validateRequest(request);

    if (isNil(event)) {
      return new Response("unknown error in clerk webhook", { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    switch (event.type) {
      case "user.created": // intentional fallthrough
      case "user.updated": {
        await context.runMutation(internal.users.upsertFromClerk, {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
          data: event.data,
        });
        break;
      }

      case "user.deleted": {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        const clerkUserId = event.data.id ?? "";
        await context.runMutation(
          internal.users.deleteFromClerk,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          { clerkUserId },
        );
        break;
      }
      default: {
        // eslint-disable-next-line no-console,@typescript-eslint/no-unsafe-member-access
        console.log("Ignored Clerk webhook event", event.type as string);
      }
    }

    return new Response(null, { status: 200 });
  }),
  method: "POST",
  path: "/clerk-users-webhook",
});

export default http;
