import { createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getCookie,
  setCookie
} from "@tanstack/react-start/server";
import { Effect, Schema } from "effect";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";

export const AUTH_COOKIE_NAME = "ethang-auth-token";
const SIGN_IN_ENDPOINT = "https://auth.ethang.dev/sign-in";
const INVALID_RESPONSE = "Invalid response from server";

const SignInResponseSchema = Schema.Struct({
  email: Schema.optional(Schema.String),
  error: Schema.optional(Schema.String),
  sessionToken: Schema.optional(Schema.String),
  username: Schema.optional(Schema.String)
});

export type SignInOutcome =
  { failure: Error; success?: never } | { failure?: never; success: User };

export type User = {
  email: string;
  sessionToken: string;
  username: string;
};

export const signOut = createServerFn({
  method: "POST",
  strict: false
}).handler(() => {
  deleteCookie(AUTH_COOKIE_NAME);
});

export const getAuthState = createServerFn().handler(() => {
  const token = getCookie(AUTH_COOKIE_NAME);
  const hasToken = !isNil(token) && 0 < token.length;
  return { isAuthenticated: hasToken };
});

export const signIn = createServerFn({ method: "POST", strict: false })
  .validator((data: { email: string; password: string }) => {
    return data;
  })
  .handler(async ({ data: { email, password } }) => {
    return Effect.runPromise(
      Effect.gen(function* () {
        const response = yield* Effect.tryPromise({
          catch: () => {
            return new Error("Failed to sign in");
          },
          try: async () => {
            return fetch(SIGN_IN_ENDPOINT, {
              body: JSON.stringify({ email, password }),
              headers: { "Content-Type": "application/json" },
              method: "POST"
            });
          }
        });

        const rawBody: unknown = yield* Effect.tryPromise({
          catch: () => {
            return new Error(INVALID_RESPONSE);
          },
          try: async () => {
            return response.json();
          }
        });

        const decoded =
          Schema.decodeUnknownEither(SignInResponseSchema)(rawBody);
        if ("Left" === decoded._tag) {
          return yield* Effect.succeed<SignInOutcome>({
            failure: new Error(INVALID_RESPONSE)
          });
        }
        const data = decoded.right;

        if (!response.ok) {
          const message = isString(data.error)
            ? data.error
            : "Failed to sign in";
          return yield* Effect.succeed<SignInOutcome>({
            failure: new Error(message)
          });
        }

        if (
          !isString(data.email) ||
          !isString(data.sessionToken) ||
          !isString(data.username)
        ) {
          return yield* Effect.succeed<SignInOutcome>({
            failure: new Error(INVALID_RESPONSE)
          });
        }

        setCookie(AUTH_COOKIE_NAME, data.sessionToken, {
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          secure: true
        });

        return yield* Effect.succeed<SignInOutcome>({
          success: {
            email: data.email,
            sessionToken: data.sessionToken,
            username: data.username
          }
        });
      }).pipe(
        Effect.catchAll((error): Effect.Effect<SignInOutcome> => {
          return Effect.succeed({ failure: error });
        })
      )
    );
  });
