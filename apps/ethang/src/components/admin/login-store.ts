import type { FormEvent } from "react";

import { BaseStore } from "@ethang/store";
import get from "lodash/get.js";
import isEmpty from "lodash/isEmpty";
import isString from "lodash/isString.js";

type LoginResponse = {
  email: string;
  id: string;
  lastLoggedIn: string;
  role: string;
  sessionToken: string;
  updatedAt: string;
  username: string;
};

const loginStoreInitialState = {
  email: "",
  isLoggedIn: false,
  isLoginLoading: false,
  loginErrorMessage: undefined as string | undefined,
  password: "",
};

class LoginStore extends BaseStore<typeof loginStoreInitialState> {
  public constructor() {
    super(loginStoreInitialState);
  }

  public handleSignIn(event: FormEvent) {
    event.preventDefault();

    this.update((draft) => {
      draft.isLoginLoading = true;
    });

    fetch("https://auth.ethang.dev/sign-in", {
      body: JSON.stringify({
        email: this.state.email,
        password: this.state.password,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
      .then(async (response) => {
        const data = await response.json<LoginResponse>();

        if (response.ok) {
          const sessionToken = get(data, ["sessionToken"]);
          if (isString(sessionToken) && !isEmpty(sessionToken)) {
            document.cookie = `ethang-auth-token=${sessionToken}; path=/; domain=${location.hostname}; secure; samesite=lax`;
          } else {
            this.update((draft) => {
              draft.loginErrorMessage = "No session token received";
            });
          }
        } else {
          this.update((draft) => {
            draft.loginErrorMessage = "Unauthorized";
          });
        }
      })
      .catch(() => {
        this.update((draft) => {
          draft.loginErrorMessage = "Unauthorized";
        });
      })
      .finally(() => {
        this.update((draft) => {
          draft.isLoginLoading = false;
        });
      });
  }

  public setEmail(email: string) {
    this.update((draft) => {
      draft.email = email;
    });
  }

  public setPassword(password: string) {
    this.update((draft) => {
      draft.password = password;
    });
  }
}

export const loginStore = new LoginStore();
