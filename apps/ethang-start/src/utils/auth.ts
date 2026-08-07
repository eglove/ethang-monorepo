const AUTH_COOKIE_NAME = "ethang-auth-token";

export const getSessionToken = (cookieHeader: string): null | string => {
  const match = cookieHeader.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]*)`));
  if (!match || !match[1]) {
    return null;
  }
  return match[1];
};
