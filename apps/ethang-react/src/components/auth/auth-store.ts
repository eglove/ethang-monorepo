import { BaseStore } from "@ethang/store";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
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

const initialState = {
  error: null as null | string,
  isPending: false,
  user: null as null | User
};

export class AuthStore extends BaseStore<typeof initialState> {
  private static readonly USER_KEY = "ethang-user" as const;

  public constructor() {
    const storedUser = localStorage.getItem(AuthStore.USER_KEY);
    let initialUser: null | User = null;
    if (null !== storedUser) {
      const parsed: unknown = attempt(() => {
        return JSON.parse(storedUser) as unknown;
      });
      if (!isError(parsed) && isObject(parsed)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const data = parsed as Record<string, unknown>;
        const { email, sessionToken, username } = data;
        if (isString(email) && isString(sessionToken) && isString(username)) {
          initialUser = {
            email,
            sessionToken,
            username
          };
        }
      }
    }
    super({
      ...initialState,
      user: initialUser
    });
  }

  public signIn = async (email: string, password: string): Promise<void> => {
    this.update((draft) => {
      draft.isPending = true;
      draft.error = null;
    });

    const result = await attemptAsync(async () => {
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
          : "Failed to sign in";
        throw new Error(errorMessage);
      }

      if (
        !isString(emailValue) ||
        !isString(sessionTokenValue) ||
        !isString(usernameValue)
      ) {
        throw new TypeError("Invalid response from server");
      }

      const user: User = {
        email: emailValue,
        sessionToken: sessionTokenValue,
        username: usernameValue
      };

      localStorage.setItem(AuthStore.USER_KEY, JSON.stringify(user));

      this.update((draft) => {
        draft.user = user;
        draft.isPending = false;
        draft.error = null;
      });
    });

    if (isError(result)) {
      this.update((draft) => {
        draft.error =
          "failed" === trim(result.message)
            ? "An unexpected error occurred"
            : result.message;

        draft.isPending = false;
      });
    }
  };

  public signOut = (): void => {
    localStorage.removeItem(AuthStore.USER_KEY);
    this.update((draft) => {
      draft.user = null;
      draft.error = null;
      draft.isPending = false;
    });
  };
}

export const authStore = new AuthStore();
