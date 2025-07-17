import {
  BaseStore,
  type StorePatch,
  type StorePatchLoose,
} from "@ethang/store";
import Cookies from "js-cookie";
import isEqual from "lodash/isEqual.js";
import isString from "lodash/isString.js";

const initialState = {
  isSignedIn: false,
  token: null as null | string,
  userId: null as null | string,
};

export class SignInStore extends BaseStore<typeof initialState> {
  public constructor() {
    super(initialState, { localStorageKey: "authStore" });
  }

  public setSignedIn(data: { token: string; userId: string }) {
    this.update((draft) => {
      draft.isSignedIn = true;
      draft.token = data.token;
      draft.userId = data.userId;
    });
  }

  public async signIn(email: string, password: string) {
    const response = await fetch("https://auth.ethang.dev/sign-in", {
      body: JSON.stringify({ email, password }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (response.ok) {
      this.setSignedIn(await response.json());
    } else {
      this.signOut();
    }
  }

  public signOut() {
    this.update((state) => {
      state.isSignedIn = false;
      state.token = null;
      state.userId = null;
    });
  }

  protected override onPropertyChange(
    patch: StorePatch<typeof initialState> | StorePatchLoose,
  ) {
    if (isEqual(patch.path, ["token"])) {
      if (isString(patch.value)) {
        Cookies.set("ethang-auth-token", patch.value);
      }

      if (!isString(patch.value)) {
        Cookies.remove("ethang-auth-token");
      }
    }
  }
}

export const signInStore = new SignInStore();
