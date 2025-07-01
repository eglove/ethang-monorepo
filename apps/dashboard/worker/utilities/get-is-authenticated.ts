import type { JwtPayload } from "jwt-decode";

import isNil from "lodash/isNil";

export const getIsAuthenticated = async (request: Request) => {
  const response = await globalThis.fetch("https://auth.ethang.dev/verify", {
    headers: {
      Cookie: request.headers.get("Cookie") ?? "",
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
