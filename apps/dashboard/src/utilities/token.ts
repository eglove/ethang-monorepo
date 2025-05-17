import { getCookieValue } from "@ethang/toolbelt/http/cookie";
import isError from "lodash/isError";

export const getToken = () => {
  const value = getCookieValue("__session", globalThis.document.cookie);

  if (isError(value)) {
    return "";
  }

  return value;
};
