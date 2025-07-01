import type { SignInSchema, SignUpSchema } from "@ethang/schemas/auth/user.ts";

import { signInResponseToken } from "@ethang/schemas/auth/token.ts";
import {
  BaseStore,
  type StorePatch,
  type StorePatchLoose,
} from "@ethang/store";
import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import { queryOptions } from "@tanstack/react-query";
import Cookies from "js-cookie";
import isEqual from "lodash/isEqual.js";
import isError from "lodash/isError";
import isNil from "lodash/isNil.js";

const defaultState = {
  isSignedIn: false,
  isSignInOpen: false,
  token: null as null | string,
  userId: null as null | string,
};

type AuthStoreState = typeof defaultState;
const authUrl = "https://auth.ethang.dev/";

export class AuthStore extends BaseStore<AuthStoreState> {
  public constructor() {
    super(defaultState, { localStorageKey: "authStore" });
  }

  public setIsSignInOpen(isOpen: boolean) {
    this.update((draft) => {
      draft.isSignInOpen = isOpen;
    });
  }

  public signIn() {
    return {
      mutationFn: async (body: SignInSchema) => {
        const url = new URL("/sign-in", authUrl);
        const data = await fetchJson(url, signInResponseToken, {
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (isError(data)) {
          this.signOut();
        } else {
          this.update((state) => {
            state.isSignedIn = true;
            state.token = data.sessionToken;
            state.userId = data.id;
            state.isSignInOpen = false;
          });
        }
      },
    };
  }

  public signOut() {
    this.update((state) => {
      state.isSignedIn = false;
      state.token = null;
      state.userId = null;
      state.isSignInOpen = false;
    });
  }

  public signUp(body: SignUpSchema) {
    return {
      mutationFn: async () => {
        const url = new URL("/sign-up", authUrl);
        const response = await globalThis.fetch(url, {
          body: JSON.stringify(body),
          method: "POST",
        });

        if (!response.ok) {
          this.signOut();
        }
      },
    };
  }

  public verify() {
    return queryOptions({
      queryFn: async () => {
        if (isNil(this.state.token)) {
          return false;
        }

        const url = new URL("/verify", authUrl);
        const response = await globalThis.fetch(url, {
          headers: {
            Authorization: this.state.token,
          },
        });

        return response.ok;
      },
      queryKey: ["auth", "verify"],
    });
  }

  protected override onPropertyChange(
    patch: StorePatch<AuthStoreState> | StorePatchLoose,
  ) {
    if (isEqual(patch.path, ["isSignedIn"])) {
      if (true === patch.value && !isNil(this.state.token)) {
        Cookies.set("authToken", this.state.token);
      }

      if (false === patch.value) {
        Cookies.remove("authToken");
      }
    }
  }
}

export const authStore = new AuthStore();
