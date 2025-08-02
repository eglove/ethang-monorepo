import type { JwtPayload } from "jwt-decode";

import isNil from "lodash/isNil";

export const getIsAuthenticated = async (request: Request) => {
  let cookie = request.headers.get("Cookie");
  const authHeader = request.headers.get("Authorization");

  if (isNil(cookie) && !isNil(authHeader)) {
    cookie = `ethang-auth-token=${authHeader}`;
  }

  const response = await globalThis.fetch("https://auth.ethang.dev/verify", {
    headers: {
      Cookie: cookie ?? "",
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
