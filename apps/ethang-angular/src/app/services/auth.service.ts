import { inject, Injectable, signal } from "@angular/core";
import { parseFetchJson } from "@ethang/toolbelt/src/fetch/json.ts";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.ts";
import { jwtDecode } from "jwt-decode";
import isError from "lodash/isError";
import isNil from "lodash/isNil";
import { z } from "zod";

import { CommentsSocketService } from "./comments-socket.service.ts";

const tokenResponseSchema = z.object({
  token: z.string(),
});

type TokenData = {
  email: string;
  username: string;
};

@Injectable({
  providedIn: "root",
})
export class AuthService {
  public readonly errorMessage = signal("");

  public readonly isSignedIn = signal(false);

  public readonly isSigningIn = signal(true);

  public readonly tokenData = signal<null | TokenData>(null);

  private readonly commentSocket = inject(CommentsSocketService);

  public constructor() {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    const token = globalThis.localStorage.getItem("token");

    if (!isNil(token)) {
      this.signIn();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call
      this.tokenData.set(jwtDecode<TokenData>(token));
    }
  }

  public handleSignMethod() {
    this.isSigningIn.set(!this.isSigningIn());
  }

  public async handleSubmit(event: Event) {
    event.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);

    const email = data.get("email");
    const username = data.get("username");
    const password = data.get("password");

    if (!this.isSigningIn() && isNil(password)) {
      return;
    }

    const url = this.isSigningIn()
      ? "https://auth.ethang.dev/sign-in"
      : "https://auth.ethang.dev/user";

    const body = this.isSigningIn()
      ? {
        email,
        password,
      }
      : {
        email,
        password,
        username,
      };

    const response = await attemptAsync(async () => {
      return globalThis.fetch(url, {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    });

    if (isError(response)) {
      this.errorMessage.set("Failed to sign up.");
      return;
    }

    const result = await parseFetchJson(response, tokenResponseSchema);

    if (isError(result)) {
      this.errorMessage.set("Failed to sign up.");
      return;
    }

    this.signIn(result.token);
  }

  private signIn(token?: string) {
    if (!isNil(token)) {
      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      globalThis.localStorage.setItem("token", token);
    }

    this.isSignedIn.set(true);
    this.commentSocket.init();
  }
}
