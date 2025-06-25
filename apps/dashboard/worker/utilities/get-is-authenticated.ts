import type { JwtPayload } from "jwt-decode";

import { getCookieValue } from "@ethang/toolbelt/http/cookie";
import isError from "lodash/isError";
import isNil from "lodash/isNil";

export const getIsAuthenticated = async (request: Request) => {
  const authToken = getCookieValue("authToken", request.headers);

  if (isError(authToken)) {
    return false;
  }

  const response = await globalThis.fetch("https://auth.ethang.dev/verify", {
    headers: {
      Authorization: authToken,
    },
  });

  if (!response.ok) {
    return false;
  }

  const payload = await response.json<JwtPayload>();

  if (isNil(payload.sub)) {
    return false;
  }

  return payload.sub;
};
