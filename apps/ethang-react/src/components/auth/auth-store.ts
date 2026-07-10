import { auth } from "@ethang/intl/en/auth.ts";
import { makeStore, type Store } from "@ethang/store/store.ts";
import { Effect } from "effect";
import attempt from "lodash/attempt.js";
import isError from "lodash/isError.js";
import isObject from "lodash/isObject.js";
import isString from "lodash/isString.js";
import trim from "lodash/trim.js";

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

const readStoredUser = (): null | User => {
  const storedUser = localStorage.getItem(USER_KEY);
  if (null === storedUser) {
    return null;
  }
  const parsed: unknown = attempt(() => {
    return JSON.parse(storedUser);
  });
  if (isError(parsed) || !isObject(parsed)) {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const data = parsed as Record<string, unknown>;
  const { email, sessionToken, username } = data;
  if (!isString(email) || !isString(sessionToken) || !isString(username)) {
    return null;
  }
  return { email, sessionToken, username };
};

export { readStoredUser };

const initialState: AuthState = {
  error: null,
  isPending: false,
  user: readStoredUser()
};

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
    Effect.tryPromise({
      catch: (error: unknown) => {
        return Error.isError(error) ? error : new Error("failed");
      },
      try: async () => {
        const response = await fetch("https://auth.ethang.dev/sign-in", {
          body: JSON.stringify({ email, password }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        });

        const data: {
          email: string;
          error: string;
          sessionToken: string;
          username: string;
        } = await response.json();

        const {
          email: emailValue,
          error: errorValue,
          sessionToken: sessionTokenValue,
          username: usernameValue
        } = data;

        if (!response.ok) {
          const errorMessage = isString(errorValue)
            ? errorValue
            : auth.FAILED_TO_SIGN_IN;
          Effect.runSync(Effect.die(new Error(errorMessage)));
        }

        if (
          !isString(emailValue) ||
          !isString(sessionTokenValue) ||
          !isString(usernameValue)
        ) {
          Effect.runSync(Effect.die(new TypeError(auth.INVALID_RESPONSE)));
        }

        const user: User = {
          email: emailValue,
          sessionToken: sessionTokenValue,
          username: usernameValue
        };

        localStorage.setItem(USER_KEY, JSON.stringify(user));

        return user;
      }
    }).pipe(
      Effect.catchAll((error: Error) => {
        return Effect.succeed(error);
      })
    )
  );

  if (isError(result)) {
    const trimmed = trim(result.message);
    const message =
      "failed" === trimmed ? auth.UNEXPECTED_ERROR : result.message;
    store.update((draft) => {
      draft.error = message;
      draft.isPending = false;
    });
    return;
  }

  store.update((draft) => {
    draft.error = null;
    draft.isPending = false;
    draft.user = result;
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
