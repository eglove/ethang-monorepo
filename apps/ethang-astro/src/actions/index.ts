import { defineAction } from "astro:actions";
import { z } from "astro/zod";
import { env } from "cloudflare:workers";
import { Effect, Schema } from "effect";
import isString from "lodash/isString.js";

const UserSchema = Schema.Struct({
  email: Schema.String,
  sessionToken: Schema.String,
  username: Schema.String
});

const SessionJsonSchema = Schema.parseJson(UserSchema);

type SignInResult =
  | { failure: Error; success?: never }
  | {
      failure?: never;
      success: { email: string; sessionToken: string; username: string };
    };

export const server = {
  addFeed: defineAction({
    accept: "form",
    handler: async (input, context) => {
      const sessionCookie = context.cookies.get("session");

      if (!sessionCookie) {
        return { error: "Unauthorized" };
      }

      const userSessionResult = await Effect.runPromise(
        Effect.try({
          catch: (_error: unknown) => {
            return new Error("Invalid session");
          },
          try: () => {
            return Schema.decodeUnknownSync(SessionJsonSchema)(
              sessionCookie.value
            );
          }
        }).pipe(
          Effect.catchAll(() => {
            return Effect.succeed({ error: "Unauthorized" });
          })
        )
      );

      if ("error" in userSessionResult) {
        return { error: userSessionResult.error };
      }

      const subscribeResult = await Effect.runPromise(
        Effect.tryPromise({
          catch: (error: unknown) => {
            return Error.isError(error) ? error : new Error(String(error));
          },
          try: async () => {
            return env.ethang_rss.addSubscription({
              sessionToken: userSessionResult.sessionToken,
              xmlAddress: input.xmlUrl
            });
          }
        }).pipe(
          Effect.map(() => {
            return { success: true as const };
          }),
          Effect.catchAll((error) => {
            const message = Error.isError(error)
              ? error.message
              : String(error);
            return Effect.succeed({ error: message });
          })
        )
      );

      if ("error" in subscribeResult) {
        return { error: subscribeResult.error };
      }

      return { success: true };
    },
    input: z.object({
      xmlUrl: z.url("Please enter a valid URL")
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
      return { data: { username: decodedUser?.username ?? "" } };
    },
    input: z.object({
      email: z.email({ message: "Invalid email address" }),
      password: z.string().min(1, "Password is required")
    })
  }),

  signOut: defineAction({
    accept: "form",
    handler: (_input, context) => {
      // httpOnly cookies cannot be cleared client-side; must delete server-side.
      context.cookies.delete("session", { path: "/" });

      return { success: true };
    }
  })
};
