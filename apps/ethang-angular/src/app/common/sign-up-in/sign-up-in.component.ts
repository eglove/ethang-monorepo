import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { parseFetchJson } from "@ethang/toolbelt/src/fetch/json";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import { z } from "zod";

const tokenResponseSchema = z.object({
  token: z.string(),
});

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  selector: "app-sign-up-in",
  styles: "",
  templateUrl: "./sign-up-in.component.html",
})
export class SignUpInComponent {
  public readonly errorMessage = signal("");

  public readonly isSignedIn = signal(false);

  public readonly isSigningIn = signal(true);

  public constructor() {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    const token = globalThis.localStorage.getItem("token");

    if (!isNil(token)) {
      this.isSignedIn.set(true);
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
      ? "https://baeb5aa4-auth.hello-a8f.workers.dev/sign-in"
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

    this.isSignedIn.set(true);
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    globalThis.localStorage.setItem("token", result.token);
  }
}
