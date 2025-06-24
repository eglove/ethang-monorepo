import { getCookieValue } from "@ethang/toolbelt/http/cookie";
import { jwtDecode } from "jwt-decode";
import isError from "lodash/isError";
import isNil from "lodash/isNil";

export const getIsAuthenticated = (request: Request) => {
  const authToken = getCookieValue("authToken", request.headers);

  if (isError(authToken)) {
    return false;
  }

  const decoded = jwtDecode(authToken);

  if (isNil(decoded.sub)) {
    return false;
  }

  return decoded.sub;
};
