import { getCookieValue } from "@ethang/toolbelt/http/cookie.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { userTokenSchema } from "../components/courses/course-completion-types.client.ts";

export class AuthService {
  private readonly AUTH_COOKIE_NAME = "ethang-auth-token";

  public getToken() {
    const value = getCookieValue(this.AUTH_COOKIE_NAME, document.cookie);

    return isError(value) ? null : value;
  }

  public async verifyToken() {
    const token = this.getToken();

    if (isNil(token)) {
      return null;
    }

    const verification = await fetch("https://auth.ethang.dev/verify", {
      headers: {
        "X-Token": token
      }
    });

    if (!verification.ok) {
      if ("cookieStore" in globalThis) {
        await cookieStore.delete(this.AUTH_COOKIE_NAME);
      } else {
        document.cookie = `${this.AUTH_COOKIE_NAME}=; Max-Age=0; path=/`;
      }
      location.reload();
      return null;
    }

    const json = await verification.json();
    const userDataResult = userTokenSchema.safeParse(json);

    if (!userDataResult.success) {
      return null;
    }

    return userDataResult.data.sub;
  }
}
