import { getActionContext } from "astro:actions";
import { defineMiddleware } from "astro:middleware";
import { Effect, Schema } from "effect";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";

const SuccessSchema = Schema.Struct({
  email: Schema.String,
  sessionToken: Schema.String,
  username: Schema.String
});

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) return next();

  const actionContext = getActionContext(context);
  const { action } = actionContext;

  // Handle form-submitted actions: call handler, redirect on success
  if ("form" === action?.calledFrom) {
    const result = (await action.handler()) as Record<string, unknown>;

    // On success, cookie was set by the action — redirect to homepage
    const decodedSuccess = Effect.runSync(
      Effect.try({
        catch: (_error: unknown) => {
          return null;
        },
        try: () => {
          return Schema.decodeUnknownSync(SuccessSchema)(result["success"]);
        }
      }).pipe(
        Effect.catchAll(() => {
          return Effect.succeed(null);
        })
      )
    );

    if (!isNil(decodedSuccess)) {
      return context.redirect("/");
    }

    // On error, stay on the login page so user sees the message
    const rawReferer = context.request.headers.get("Referer");
    if (isNil(rawReferer) || isEmpty(rawReferer)) {
      return next();
    }

    const parsedUrl = Effect.runSync(
      Effect.try({
        catch: (_error: unknown) => {
          return null;
        },
        try: () => {
          return Schema.decodeUnknownSync(Schema.URL)(rawReferer);
        }
      }).pipe(
        Effect.catchAll(() => {
          return Effect.succeed(null);
        })
      )
    );

    if (!isNil(parsedUrl) && parsedUrl.origin === context.url.origin) {
      return context.redirect(parsedUrl.pathname + parsedUrl.search);
    }

    return next();
  }

  return next();
});
