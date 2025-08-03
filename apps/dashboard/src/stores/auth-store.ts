import type { SignInSchema } from "@ethang/schemas/auth/user.ts";

import { signInResponseToken } from "@ethang/schemas/auth/token.ts";
import { BaseStore, type StorePatch } from "@ethang/store";
import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import Cookies from "js-cookie";
import isEqual from "lodash/isEqual.js";
import isError from "lodash/isError";
import isNil from "lodash/isNil.js";

const defaultState = {
  isPending: false,
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

  public async callSignIn(body: SignInSchema) {
    this.update((state) => {
      state.isPending = true;
    });

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
        state.isPending = false;
      });
    }
  }

  public setIsSignInOpen(isOpen: boolean) {
    this.update((draft) => {
      draft.isSignInOpen = isOpen;
    });
  }

  public signOut() {
    this.update((state) => {
      state.isSignedIn = false;
      state.token = null;
      state.userId = null;
      state.isSignInOpen = false;
      state.isPending = false;
    });
  }

  protected override onPropertyChange(patch: StorePatch<AuthStoreState>) {
    if (isEqual(patch.path, ["isSignedIn"])) {
      if (true === patch.value && !isNil(this.state.token)) {
        Cookies.set("ethang-auth-token", this.state.token);
      }

      if (false === patch.value) {
        Cookies.remove("ethang-auth-token");
      }
    }
  }
}

export const authStore = new AuthStore();
