import { ActionError, defineAction } from "astro:actions";

type ActionErrorInput = ConstructorParameters<typeof ActionError>[0];
import { z } from "astro/zod";
import { env } from "cloudflare:workers";
import { Effect, Schema } from "effect";
import constant from "lodash/constant.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";

import { isApplicationStatus } from "../lib/applications.ts";
import { resolveLoginRedirect } from "../lib/login.ts";
import {
  addFeed as addFeedProgram,
  markArticleRead as markArticleReadProgram,
  removeFeed as removeFeedProgram
} from "../lib/rss.ts";
import { decodeSessionCookie } from "../lib/session.ts";

const UserSchema = Schema.Struct({
  email: Schema.String,
  sessionToken: Schema.String,
  username: Schema.String
});

type SignInResult =
  | { failure: Error; success?: never }
  | {
      failure?: never;
      success: { email: string; sessionToken: string; username: string };
    };

const getSessionUser = (context: {
  cookies: { get: (name: string) => { value?: string } | undefined };
}) => {
  return decodeSessionCookie(context.cookies.get("session")?.value);
};

const rejectActionError = async (input: ActionErrorInput) => {
  await Promise.reject(new ActionError(input));
};

export const server = {
  addFeed: defineAction({
    accept: "form",
    handler: async (input, context) => {
      const userSession = getSessionUser(context);

      if (isNil(userSession)) {
        return { error: "Unauthorized" };
      }

      return addFeedProgram(env.ethang_rss, {
        sessionToken: userSession.sessionToken,
        xmlAddress: input.xmlUrl
      });
    },
    input: z.object({
      xmlUrl: z.url("Please enter a valid URL")
    })
  }),

  markArticleRead: defineAction({
    accept: "form",
    handler: async (input, context) => {
      const userSession = getSessionUser(context);

      if (isNil(userSession)) {
        return { error: "Unauthorized" };
      }

      return markArticleReadProgram(env.ethang_rss, {
        articleId: input.articleId,
        isRead: true,
        sessionToken: userSession.sessionToken
      });
    },
    input: z.object({
      articleId: z.string().min(1, "Article is required")
    })
  }),

  removeFeed: defineAction({
    accept: "form",
    handler: async (input, context) => {
      const userSession = getSessionUser(context);

      if (isNil(userSession)) {
        return { error: "Unauthorized" };
      }

      return removeFeedProgram(env.ethang_rss, {
        feedId: input.feedId,
        sessionToken: userSession.sessionToken
      });
    },
    input: z.object({
      feedId: z.string().min(1, "Feed is required")
    })
  }),

  signIn: defineAction({
    accept: "form",
    handler: async (input, context) => {
      const signInResult: SignInResult = await Effect.runPromise(
        Effect.gen(function* () {
          const response = yield* Effect.tryPromise({
            catch: (_error: unknown) => {
              return new Error("An unexpected error occurred");
            },
            try: async () => {
              return fetch("https://auth.ethang.dev/sign-in", {
                body: JSON.stringify({
                  email: input.email,
                  password: input.password
                }),
                headers: { "Content-Type": "application/json" },
                method: "POST"
              });
            }
          });

          if (!response.ok) {
            return yield* Effect.succeed({
              failure: new Error("Invalid Credentials")
            });
          }

          const rawJson = yield* Effect.tryPromise({
            catch: (_error: unknown) => {
              return new Error("An unexpected error occurred");
            },
            try: async () => {
              return response.json();
            }
          });

          // Validate the auth response using Effect Schema
          const decoded = yield* Effect.try({
            catch: (_error: unknown) => {
              return new Error("Invalid response from server");
            },
            try: () => {
              return Schema.decodeUnknownSync(UserSchema)(rawJson);
            }
          });

          if (
            !isString(decoded.email) ||
            !isString(decoded.sessionToken) ||
            !isString(decoded.username)
          ) {
            return yield* Effect.succeed({
              failure: new Error("Invalid response from server")
            });
          }

          // Set httpOnly session cookie server-side via context.cookies
          context.cookies.set("session", JSON.stringify(decoded), {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
            sameSite: "lax"
          });

          return yield* Effect.succeed({ success: decoded });
        }).pipe(
          Effect.catchAll((error: unknown) => {
            return Effect.succeed({
              failure: Error.isError(error) ? error : new Error(String(error))
            });
          })
        )
      );

      if ("failure" in signInResult && Error.isError(signInResult.failure)) {
        return { error: signInResult.failure.message };
      }

      const decodedUser = signInResult.success;
      return {
        data: {
          redirect: resolveLoginRedirect(input.redirect),
          username: decodedUser?.username ?? ""
        }
      };
    },
    input: z.object({
      email: z.email({ message: "Invalid email address" }),
      password: z.string().min(1, "Password is required"),
      redirect: z.string().optional()
    })
  }),

  signOut: defineAction({
    accept: "form",
    handler: (_input, context) => {
      // httpOnly cookies cannot be cleared client-side; must delete server-side.
      context.cookies.delete("session", { path: "/" });

      return { success: true };
    }
  }),

  updateApplicationStatus: defineAction({
    accept: "form",
    handler: async (input, context) => {
      const userSession = getSessionUser(context);

      if (isNil(userSession)) {
        return rejectActionError({
          code: "UNAUTHORIZED",
          message: "Unauthorized"
        });
      }

      if (!isApplicationStatus(input.status)) {
        return rejectActionError({
          code: "BAD_REQUEST",
          message: "Invalid application status"
        });
      }

      const result = await env.job_applications
        .updateApplication({
          id: input.id,
          status: input.status,
          token: userSession.sessionToken
        })
        .catch(constant(null));

      if (isNil(result) || !result.ok) {
        return rejectActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to update application."
        });
      }

      return { success: true };
    },
    input: z.object({
      after: z.string().optional(),
      id: z.string().min(1, "Application is required"),
      status: z.enum([
        "applied",
        "screening",
        "interview",
        "offer",
        "rejected",
        "withdrawn"
      ])
    })
  })
};
