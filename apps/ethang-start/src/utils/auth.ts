import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";

const AUTH_COOKIE_NAME = "ethang-auth-token";

export const getSessionToken = (cookieHeader: string) => {
  const cookiePattern = new RegExp(`${AUTH_COOKIE_NAME}=([^;]*)`, "u");
  const match = cookiePattern.exec(cookieHeader);
  const token = match?.[1];
  if (isNil(token) || isEmpty(token)) {
    return null;
  }
  return token;
};
