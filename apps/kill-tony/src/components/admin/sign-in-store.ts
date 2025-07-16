import type { signInResponseToken } from "@ethang/schemas/auth/token.ts";
import type { SignInSchema } from "@ethang/schemas/auth/user.ts";
import type z from "zod";

import {
  BaseStore,
  type StorePatch,
  type StorePatchLoose,
} from "@ethang/store";
import { Client } from "@hyper-fetch/core";
import { DevtoolsPlugin } from "@hyper-fetch/plugin-devtools";
import Cookies from "js-cookie";
import isEqual from "lodash/isEqual.js";
import isNil from "lodash/isNil";

const initialState = {
  isSignedIn: false,
  token: null as null | string,
  userId: null as null | string,
};

const client = new Client({
  url: "https://auth.ethang.dev",
}).addPlugin(DevtoolsPlugin({ appName: "Auth" }));

export const signIn = client.createRequest<{
  payload: SignInSchema;
  response: z.output<typeof signInResponseToken>;
}>()({
  endpoint: "/sign-in",
  method: "POST",
});

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

  protected override onPropertyChange(
    patch: StorePatch<typeof initialState> | StorePatchLoose,
  ) {
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

export const signInStore = new SignInStore();
