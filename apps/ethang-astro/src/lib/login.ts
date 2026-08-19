export type LoginOutcome =
  { error: null | string; kind: "error" } | { kind: "redirect"; path: string };

import isNil from "lodash/isNil.js";
import isObject from "lodash/isObject.js";
import isString from "lodash/isString.js";

export type LoginResult = {
  data?: unknown;
  error?: { message?: string };
};

export const resolveLoginRedirect = (value: null | string | undefined) => {
  return isString(value) && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";
};

export function resolveLoginOutcome(
  result: LoginResult | undefined,
  urlError: null | string,
  requestedRedirect: null | string = null
) {
  if (!isNil(result) && isNil(result.error)) {
    const data = result.data;
    const redirect =
      isObject(data) && "redirect" in data ? data.redirect : null;
    return {
      kind: "redirect",
      path: resolveLoginRedirect(
        isString(redirect) ? redirect : requestedRedirect
      )
    };
  }

  return { error: result?.error?.message ?? urlError, kind: "error" };
}
