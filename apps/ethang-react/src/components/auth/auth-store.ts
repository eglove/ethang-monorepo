import { makeStore, type Store } from "@ethang/store/store.ts";
import { Effect, Schema } from "effect";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";

import { auth } from "../../constants/auth.ts";
export type User = {
  email: string;
  sessionToken: string;
  username: string;
};

const USER_KEY = "ethang-user" as const;

export type AuthState = {
  error: null | string;
  isPending: boolean;
  user: null | User;
};

const StoredUserSchema = Schema.Struct({
  email: Schema.String,
  sessionToken: Schema.String,
  username: Schema.String
});

const readStoredUser = () => {
  const storedUser = localStorage.getItem(USER_KEY);
  if (isNil(storedUser)) {
    return null;
  }
  const decoded = Schema.decodeUnknownOption(
    Schema.parseJson(StoredUserSchema)
  )(storedUser);
  return "Some" === decoded._tag ? decoded.value : null;
};

export { readStoredUser };

const initialState: AuthState = {
  error: null,
  isPending: false,
  user: readStoredUser()
};

type SignInOutcome =
  { failure: Error; success?: never } | { failure?: never; success: User };

const SignInResponseSchema = Schema.Struct({
  email: Schema.optional(Schema.String),
  error: Schema.optional(Schema.String),
  sessionToken: Schema.optional(Schema.String),
  username: Schema.optional(Schema.String)
});

const signIn = async (
  store: Store<AuthState>,
  email: string,
  password: string
) => {
  store.update((draft) => {
    draft.error = null;
    draft.isPending = true;
  });

  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const response: Response = yield* Effect.tryPromise({
        catch: (error: unknown) => {
          return Error.isError(error)
            ? error
            : new Error(auth.UNEXPECTED_ERROR);
        },
        try: async () => {
          return fetch("https://auth.ethang.dev/sign-in", {
            body: JSON.stringify({ email, password }),
            headers: {
              "Content-Type": "application/json"
            },
            method: "POST"
          });
        }
      });

      const rawJson: unknown = yield* Effect.tryPromise({
        catch: (error: unknown) => {
          return Error.isError(error)
            ? error
            : new Error(auth.UNEXPECTED_ERROR);
        },
        try: async () => {
          return response.json();
        }
      });

      const decoded = Schema.decodeUnknownEither(SignInResponseSchema)(rawJson);
      if ("Left" === decoded._tag) {
        return yield* Effect.succeed<SignInOutcome>({
          failure: new Error(auth.INVALID_RESPONSE)
        });
      }
      const data = decoded.right;

      if (!response.ok) {
        const errorMessage = isString(data.error)
          ? data.error
          : auth.FAILED_TO_SIGN_IN;
        return yield* Effect.succeed<SignInOutcome>({
          failure: new Error(errorMessage)
        });
      }

      if (
        !isString(data.email) ||
        !isString(data.sessionToken) ||
        !isString(data.username)
      ) {
        return yield* Effect.succeed<SignInOutcome>({
          failure: new Error(auth.INVALID_RESPONSE)
        });
      }

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

  if (!isNil(result.failure)) {
    const { message } = result.failure;
    store.update((draft) => {
      draft.error = message;
      draft.isPending = false;
    });
    return;
  }

  const user = result.success;
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  store.update((draft) => {
    draft.error = null;
    draft.isPending = false;
    // @ts-expect-error no reachable
    draft.user = user;
  });
};

const signOut = (store: Store<AuthState>) => {
  localStorage.removeItem(USER_KEY);
  store.update((draft) => {
    draft.error = null;
    draft.isPending = false;
    draft.user = null;
  });
};

export const authStore: Store<AuthState> = makeStore(initialState);

export const authStoreActions = {
  signIn: async (email: string, password: string) => {
    return signIn(authStore, email, password);
  },
  signOut: () => {
    signOut(authStore);
  }
};
